import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the directory path for work instructions
    const directoryPath = path.join(process.cwd(), 'public', 'werkinstructies');
    
    // Read all files in the directory
    const files = fs.readdirSync(directoryPath);
    
    // Filter for markdown files and create instruction objects
    const instructions = files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        // Extract the title from the file name (remove .md extension and replace hyphens with spaces)
        const id = file.replace('.md', '');
        const title = id
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return {
          id,
          title
        };
      });

    return NextResponse.json(instructions);
  } catch (error) {
    console.error('Error fetching instructions:', error);
    return NextResponse.json({ error: 'Failed to fetch instructions' }, { status: 500 });
  }
} 