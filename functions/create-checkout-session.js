// URL import is REQUIRED for no-build deployments
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

export async function onRequestPost({ request, env }) {
    try {
        // 1. Check for API Key
        if (!env.STRIPE_SECRET_KEY) {
            return new Response("Error: STRIPE_SECRET_KEY is missing in Cloudflare settings.", { status: 500 });
        }

        // 2. Initialize Stripe
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        // 3. Parse Body
        const body = await request.json();
        const { cart } = body;

        if (!cart || !Array.isArray(cart)) {
            return new Response("Error: Invalid cart data.", { status: 400 });
        }

        // 4. Create Session
        const session = await stripe.checkout.sessions.create({
            line_items: cart.map(item => ({
                price: item.priceId,
                quantity: parseInt(item.qty) || 1,
            })),
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        // 5. Return Session URL
        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
