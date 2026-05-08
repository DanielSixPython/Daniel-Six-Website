import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        // 1. Validate environment variables
        if (!env.STRIPE_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Stripe Secret Key is missing in Cloudflare settings." }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 2. Parse and validate the request body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: "Malformed JSON request." }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const { cart } = body;
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return new Response(JSON.stringify({ error: "Your cart appears to be empty." }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 3. Initialize Stripe
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient()
        });

        // 4. Map cart items to Stripe Line Items
        const lineItems = cart.map(item => ({
            price: item.priceId,
            quantity: parseInt(item.qty) || 1,
        }));

        // 5. Create the Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        // 6. Return the URL for the frontend to redirect
        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Stripe Session Error:", error);
        return new Response(JSON.stringify({ 
            error: error.message || "Internal server error" 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}
