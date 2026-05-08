import Stripe from 'stripe';

/**
 * Cloudflare Pages Function: handles the POST request to create a Stripe session.
 */
export async function onRequestPost({ request, env }) {
    try {
        // 1. Validate Secret Key from Cloudflare Environment Variables
        if (!env.STRIPE_SECRET_KEY) {
            return new Response(JSON.stringify({ 
                error: "STRIPE_SECRET_KEY is not set in Cloudflare Settings." 
            }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 2. Parse the Incoming Request
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON request body." }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const { cart } = body;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return new Response(JSON.stringify({ error: "Cart data is missing or empty." }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 3. Initialize Stripe
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient() // Essential for Cloudflare Workers
        });

        // 4. Map Cart Items to Stripe Format
        const lineItems = cart.map(item => ({
            price: item.priceId,
            quantity: item.qty,
        }));

        // 5. Create the Session
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            // Uses the current origin (danielsix.com) dynamically
            success_url: `${new URL(request.url).origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        // 6. Send the URL back to the frontend
        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Stripe Session Creation Error:", error);
        return new Response(JSON.stringify({ 
            error: error.message || "Internal server error" 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}
