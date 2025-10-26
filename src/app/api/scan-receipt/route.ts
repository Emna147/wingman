import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('API Key exists:', apiKey.substring(0, 10) + '...');

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file required' },
        { status: 400 }
      );
    }

    console.log('Processing image:', imageFile.name, imageFile.type, imageFile.size);

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Use gemini-2.5-flash - the latest model you have access to
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this receipt image and extract the following information in JSON format:
{
  "amount": <total amount as a number>,
  "category": <one of: "Accommodation", "Food", "Transport", "Social", "Miscellaneous">,
  "description": <brief description of what was purchased>,
  "date": <date in YYYY-MM-DD format, use today's date if not visible>,
  "location": <merchant name or location if visible>,
  "currency": <currency code like USD, EUR, etc. Default to USD if not visible>
}

Rules:
- For category, intelligently match the purchase to one of the 5 categories
- If it's a restaurant/food purchase, use "Food"
- If it's a hotel/lodging, use "Accommodation"
- If it's taxi/uber/transport, use "Transport"
- If it's entertainment/bar/club, use "Social"
- Otherwise use "Miscellaneous"
- Return ONLY the JSON object, no additional text
- If you cannot read the receipt clearly, return an error field: {"error": "Cannot read receipt"}`
                },
                {
                  inline_data: {
                    mime_type: imageFile.type,
                    data: base64Image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to process receipt', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Full API Response:', JSON.stringify(result, null, 2));

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text response from AI' },
        { status: 500 }
      );
    }

    console.log('AI Response text:', text);

    let receiptData;
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      receiptData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json(
        { error: 'Failed to parse receipt data', details: text },
        { status: 500 }
      );
    }

    if (receiptData.error) {
      return NextResponse.json(
        { error: receiptData.error },
        { status: 400 }
      );
    }

    if (!receiptData.amount || !receiptData.category) {
      return NextResponse.json(
        { error: 'Could not extract required information from receipt' },
        { status: 400 }
      );
    }

    console.log('Successfully extracted receipt data:', receiptData);

    return NextResponse.json({
      success: true,
      data: receiptData,
    });
  } catch (error) {
    console.error('Error processing receipt:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process receipt', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}