import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = params;
    
    // Get the file path for the requested work instruction
    const filePath = path.join(process.cwd(), 'public', 'werkinstructies', `${slug}.md`);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Werkinstructie niet gevonden' }, { status: 404 });
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract the title from the file name (replace hyphens with spaces and capitalize)
    const title = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return NextResponse.json({
      id: slug,
      title,
      content
    });
  } catch (error) {
    console.error('Error fetching instruction:', error);
    return NextResponse.json({ error: 'Failed to fetch instruction' }, { status: 500 });
  }
} 