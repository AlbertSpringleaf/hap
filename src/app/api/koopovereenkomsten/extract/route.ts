import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth.config';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  let koopovereenkomstId: string | undefined;
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { koopovereenkomstId: id } = await request.json();
    koopovereenkomstId = id;

    if (!koopovereenkomstId) {
      return NextResponse.json(
        { error: 'Koopovereenkomst ID is verplicht' },
        { status: 400 }
      );
    }

    // Get the user and their organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Get the koopovereenkomst
    const koopovereenkomst = await prisma.koopovereenkomst.findUnique({
      where: { id: koopovereenkomstId },
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

    if (!koopovereenkomst) {
      return NextResponse.json({ error: 'Koopovereenkomst niet gevonden' }, { status: 404 });
    }

    // Check if the koopovereenkomst belongs to the user
    if (koopovereenkomst.userId !== user.id) {
      return NextResponse.json({ error: 'Geen toegang tot deze koopovereenkomst' }, { status: 403 });
    }

    // Get the organization name for the tenant
    const tenant = user.organization?.name || 'springleafautomation';

    // Call the external API to extract data
    const response = await fetch(
      'https://prod-44.westeurope.logic.azure.com:443/workflows/291820032aba4804a1b333974e420bad/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=z2Eaxok4naaeJcXR1wH_ujBdMbV48YrZC3u6oJN9TT0',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'mJfnvmUzmaxbyvUzdLnR',
        },
        body: JSON.stringify({
          file: koopovereenkomst.pdfBase64,
          filename: koopovereenkomst.naam,
          tenant: tenant,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error from extraction API:', errorData);
      
      // Update the koopovereenkomst with failed status and error message
      if (koopovereenkomstId) {
        try {
          // First update the status
          await prisma.koopovereenkomst.update({
            where: { id: koopovereenkomstId },
            data: {
              status: 'uitlezen mislukt',
            },
          });

          // Then update the error message
          await prisma.koopovereenkomst.update({
            where: { id: koopovereenkomstId },
            data: {
              errorMessage: JSON.stringify({ error: errorData }),
            } as Prisma.KoopovereenkomstUpdateInput,
          });
        } catch (updateError) {
          console.error('Error updating koopovereenkomst with error message:', updateError);
        }
      }
      
      return NextResponse.json(
        { error: 'Fout bij het extraheren van gegevens uit de koopovereenkomst' },
        { status: 500 }
      );
    }

    const extractedData = await response.json();

    // Update the koopovereenkomst with the extracted data
    const updatedKoopovereenkomst = await prisma.koopovereenkomst.update({
      where: { id: koopovereenkomstId },
      data: {
        status: 'uitgelezen',
        jsonData: extractedData,
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

    // Return the response with user information
    return NextResponse.json({
      id: updatedKoopovereenkomst.id,
      naam: updatedKoopovereenkomst.naam,
      status: updatedKoopovereenkomst.status,
      jsonData: updatedKoopovereenkomst.jsonData,
      createdAt: updatedKoopovereenkomst.createdAt,
      updatedAt: updatedKoopovereenkomst.updatedAt,
      user: updatedKoopovereenkomst.user ? {
        id: updatedKoopovereenkomst.user.id,
        name: updatedKoopovereenkomst.user.name,
        email: updatedKoopovereenkomst.user.email,
      } : undefined,
    });
  } catch (error) {
    console.error('Error extracting data from koopovereenkomst:', error);
    
    // Update the koopovereenkomst with failed status and error message
    if (koopovereenkomstId) {
      try {
        // First update the status
        await prisma.koopovereenkomst.update({
          where: { id: koopovereenkomstId },
          data: {
            status: 'uitlezen mislukt',
          },
        });

        // Then update the error message
        await prisma.koopovereenkomst.update({
          where: { id: koopovereenkomstId },
          data: {
            errorMessage: JSON.stringify({ error: error instanceof Error ? error.message : 'Onbekende fout' }),
          } as Prisma.KoopovereenkomstUpdateInput,
        });
      } catch (updateError) {
        console.error('Error updating koopovereenkomst with error message:', updateError);
      }
    }
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het extraheren van gegevens uit de koopovereenkomst' },
      { status: 500 }
    );
  }
} 