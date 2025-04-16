import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth.config';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Define the type for koopovereenkomst response
interface KoopovereenkomstResponse {
  id: string;
  naam: string;
  status: string;
  jsonData?: any;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { naam, pdfBase64 } = await request.json();

    // Validate input
    if (!naam || !pdfBase64) {
      return NextResponse.json(
        { error: `Ongeldige input: ${!naam ? 'naam ontbreekt' : ''} ${!pdfBase64 ? 'pdfBase64 ontbreekt' : ''}`.trim() },
        { status: 400 }
      );
    }

    // Validate file name
    if (!naam.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: `Ongeldige bestandsnaam: ${naam}. Bestand moet eindigen op .pdf` },
        { status: 400 }
      );
    }

    // Validate base64 string
    try {
      // More efficient base64 validation that won't cause stack overflow
      // Instead of using regex on the entire string, we'll check a sample
      const sampleSize = 1000; // Check first 1000 characters
      const sample = pdfBase64.substring(0, sampleSize);
      const base64Regex = /^[A-Za-z0-9+/=\r\n]+$/;
      
      if (!base64Regex.test(sample)) {
        console.error('Base64 validation failed on sample:', {
          sampleLength: sample.length,
          firstChars: sample.substring(0, 50),
          invalidChars: sample.replace(/[A-Za-z0-9+/=\r\n]/g, '').slice(0, 10)
        });
        return NextResponse.json(
          { error: 'Ongeldig bestand: het bestand is beschadigd of geen geldig PDF bestand' },
          { status: 400 }
        );
      }

      // Additional validation: check if the base64 string is not empty after trimming
      const trimmedBase64 = pdfBase64.trim();
      if (!trimmedBase64) {
        return NextResponse.json(
          { error: 'Ongeldig bestand: leeg bestand' },
          { status: 400 }
        );
      }

      // Check if the base64 string is not too short (minimum size for a valid PDF)
      if (trimmedBase64.length < 100) {
        return NextResponse.json(
          { error: 'Ongeldig bestand: bestand is te klein' },
          { status: 400 }
        );
      }

      // Check if the base64 string is not too long (max 40MB)
      const maxSize = 40 * 1024 * 1024; // 40MB in bytes
      // Base64 encoding increases size by ~33%, so we divide by 1.33 to get original size
      const estimatedOriginalSize = Math.ceil(trimmedBase64.length / 1.33);
      
      console.log('File size validation:', {
        base64Length: trimmedBase64.length,
        estimatedOriginalSize,
        maxSize,
        estimatedMB: (estimatedOriginalSize / (1024 * 1024)).toFixed(2)
      });

      if (estimatedOriginalSize > maxSize) {
        return NextResponse.json(
          { error: `Bestand is te groot (${(estimatedOriginalSize / (1024 * 1024)).toFixed(1)}MB). Maximum is 40MB.` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error validating base64:', error);
      return NextResponse.json(
        { error: 'Ongeldig bestand: onverwachte fout bij verwerken van het bestand' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Check database capacity before attempting to save
    try {
      // Try to create a small test record to check if database has capacity
      const testRecord = await prisma.$queryRaw<Array<{
        db_size: number;
        db_size_pretty: string;
        db_size_mb: number;
      }>>`
        SELECT pg_database_size(current_database()) as db_size,
               pg_size_pretty(pg_database_size(current_database())) as db_size_pretty,
               pg_database_size(current_database()) / (1024*1024) as db_size_mb
      `;
      
      console.log('Database capacity check:', testRecord);
      
      // If database is approaching capacity limit (e.g., 90% of max), return error
      // This is a placeholder - adjust the threshold based on your actual database limits
      const dbSizeMB = testRecord[0].db_size_mb;
      const maxDbSizeMB = 1000; // Example: 1GB limit
      
      if (dbSizeMB > maxDbSizeMB * 0.9) {
        return NextResponse.json(
          { error: `Database vol (${dbSizeMB.toFixed(0)}MB). Neem contact op met de beheerder.` },
          { status: 507 } // 507 Insufficient Storage
        );
      }
    } catch (dbError) {
      console.error('Error checking database capacity:', dbError);
      // Continue with the upload even if capacity check fails
    }

    // Try to create the koopovereenkomst with a timeout
    const koopovereenkomst = await Promise.race([
      prisma.koopovereenkomst.create({
        data: {
          naam,
          pdfBase64,
          jsonData: {},
          status: 'geüpload',
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout: operatie duurde te lang')), 30000)
      )
    ]) as KoopovereenkomstResponse;

    return NextResponse.json({
      id: koopovereenkomst.id,
      naam: koopovereenkomst.naam,
      status: koopovereenkomst.status,
      jsonData: koopovereenkomst.jsonData,
      createdAt: koopovereenkomst.createdAt,
      updatedAt: koopovereenkomst.updatedAt,
      user: koopovereenkomst.user ? {
        id: koopovereenkomst.user.id,
        name: koopovereenkomst.user.name,
        email: koopovereenkomst.user.email,
      } : undefined,
    });
  } catch (error) {
    console.error('Error creating koopovereenkomst:', error);
    
    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Upload duurde te lang. Probeer het opnieuw.' },
          { status: 504 } // Gateway Timeout
        );
      }
      
      if (error.message.includes('insufficient storage') || error.message.includes('disk full')) {
        return NextResponse.json(
          { error: 'Database vol. Neem contact op met de beheerder.' },
          { status: 507 } // Insufficient Storage
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het uploaden. Probeer het opnieuw.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Gebruiker heeft geen organisatie' }, { status: 400 });
    }

    // Get all koopovereenkomsten from users in the same organization
    const koopovereenkomsten = await prisma.koopovereenkomst.findMany({
      where: {
        user: {
          organizationId: user.organizationId
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Filter out sensitive data before sending to client
    const filteredKoopovereenkomsten = koopovereenkomsten.map((koopovereenkomst: any): KoopovereenkomstResponse => ({
      id: koopovereenkomst.id,
      naam: koopovereenkomst.naam,
      status: koopovereenkomst.status,
      errorMessage: koopovereenkomst.errorMessage,
      createdAt: koopovereenkomst.createdAt,
      updatedAt: koopovereenkomst.updatedAt,
      user: koopovereenkomst.user ? {
        id: koopovereenkomst.user.id,
        name: koopovereenkomst.user.name,
        email: koopovereenkomst.user.email,
      } : undefined,
    }));

    return NextResponse.json(filteredKoopovereenkomsten);
  } catch (error) {
    console.error('Error fetching koopovereenkomsten:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van de koopovereenkomsten' },
      { status: 500 }
    );
  }
} 