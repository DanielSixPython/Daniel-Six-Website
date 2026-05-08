export async function onRequestPost({ request, env }) {
    try {
        // 1. Dynamic Import: This bypasses the Cloudflare Build Error
        const { default: Stripe } = await import('https://esm.sh/stripe@14.25.0?target=worker');

        if (!env.STRIPE_SECRET_KEY) {
            return new Response("API Key Missing in Cloudflare Settings", { status: 500 });
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        const body = await request.json();
        const { cart } = body;

        const session = await stripe.checkout.sessions.create({
            line_items: cart.map(item => ({
                price: item.priceId,
                quantity: parseInt(item.qty) || 1,
            })),
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
