import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        // 1. Check for the secret key in Cloudflare Environment Variables
        if (!env.STRIPE_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY in Cloudflare settings." }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 2. Parse the request body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON input." }), { status: 400 });
        }

        const { cart } = body;
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return new Response(JSON.stringify({ error: "Cart is empty." }), { status: 400 });
        }

        // 3. Initialize Stripe
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient()
        });

        // 4. Map cart to Stripe Line Items
        const lineItems = cart.map(item => ({
            price: item.priceId,
            quantity: parseInt(item.qty) || 1,
        }));

        // 5. Create the session
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        // 6. Return the URL
        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Stripe Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
