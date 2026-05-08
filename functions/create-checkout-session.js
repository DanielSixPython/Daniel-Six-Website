// We remove the https://esm.sh prefix and use a standard import. 
// Cloudflare will attempt to resolve this during the "Compiling" phase.
import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        if (!env.STRIPE_SECRET_KEY) {
            return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
        }

        // Initialize Stripe using the global fetch compatible with Cloudflare
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
        return new Response(error.message, { status: 500 });
    }
}
