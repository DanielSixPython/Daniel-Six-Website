// We use a specific version of Stripe that works in Worker environments without a build step
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

export async function onRequestPost({ request, env }) {
    try {
        // 1. Safety check for the Environment Variable
        if (!env.STRIPE_SECRET_KEY) {
            return new Response("Missing STRIPE_SECRET_KEY in Cloudflare Settings", { status: 500 });
        }

        // 2. Initialize Stripe with the built-in Fetch client
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        const body = await request.json();
        const { cart } = body;

        // 3. Create the Stripe Session
        const session = await stripe.checkout.sessions.create({
            line_items: cart.map(item => ({
                price: item.priceId,
                quantity: parseInt(item.qty) || 1,
            })),
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        // 4. Return the session URL
        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Stripe Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}
