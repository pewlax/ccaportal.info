// Netlify serverless function — proxies AI calls securely
// The ANTHROPIC_API_KEY env var is server-side only, never exposed to browser
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { prompt, type } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json({ error: 'AI not configured. Add ANTHROPIC_API_KEY in Netlify env vars.' }, { status: 500 });
    }

    let systemPrompt = '';
    if (type === 'competitor') {
      systemPrompt = `You are an Instagram analytics expert. When given an Instagram handle, estimate their stats based on your knowledge. Return ONLY valid JSON with no other text, no markdown, no backticks. The JSON must have these fields:
{"name":"string","handle":"@string","followers":number,"engagement":number,"views30d":number,"niche":"string","analysis":"2 sentence strategy analysis","top_videos":[{"caption":"string","views":number,"likes":number,"date":"string"}]}
If you don't know the exact account, make reasonable estimates for a typical account in that niche. Always return valid JSON only.`;
    } else if (type === 'client-analysis') {
      systemPrompt = `You are a content agency strategist. Analyze the client data provided and give actionable insights. Return ONLY valid JSON:
{"score":number_0_to_100,"summary":"1 paragraph overview","strengths":["string","string"],"weaknesses":["string","string"],"recommendations":["actionable tip 1","actionable tip 2","actionable tip 3"],"predicted_growth":"prediction for next 30 days"}
Always return valid JSON only, no markdown.`;
    } else if (type === 'content-ideas') {
      systemPrompt = `You are a viral content strategist for Instagram. Based on the niche and data provided, suggest content ideas. Return ONLY valid JSON:
{"ideas":[{"title":"string","format":"Reel/Carousel/Story","hook":"first 3 seconds hook","why":"why this will work","estimated_views":"range like 50K-100K"}]}
Generate 5 ideas. Return valid JSON only, no markdown.`;
    } else {
      systemPrompt = 'You are a helpful analytics assistant. Return JSON only, no markdown.';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';

    // Try to parse as JSON
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return Response.json(parsed);
    } catch {
      return Response.json({ raw: text });
    }
  } catch (e) {
    return Response.json({ error: 'AI request failed: ' + e.message }, { status: 500 });
  }
};

export const config = { path: '/api/ai' };
