import { PADDLE_ENVIRONMENT, PADDLE_CLIENT_TOKEN, PADDLE_SUBSCRIPTION_PRICE_ID } from "./config"

declare global {
  interface Window {
    Paddle: any
  }
}

interface PaddleCheckoutOptions {
  email: string
  userId: string
}

// Load Paddle script and initialize
export const initializePaddle = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Paddle is already loaded
    if (window.Paddle) {
      resolve()
      return
    }

    // Create and load the Paddle script
    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true

    script.onload = () => {
      try {
        // Set environment
        window.Paddle.Environment.set(PADDLE_ENVIRONMENT)

        // Initialize Paddle
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
        })

        resolve()
      } catch (error) {
        reject(error)
      }
    }

    script.onerror = () => {
      reject(new Error("Failed to load Paddle script"))
    }

    document.head.appendChild(script)
  })
}

// Open Paddle checkout
export const openPaddleCheckout = async (options: PaddleCheckoutOptions): Promise<void> => {
  try {
    // Ensure Paddle is initialized
    await initializePaddle()

    if (!PADDLE_SUBSCRIPTION_PRICE_ID) {
      throw new Error("Paddle subscription price ID not configured")
    }

    const itemsList = [
      {
        priceId: PADDLE_SUBSCRIPTION_PRICE_ID,
        quantity: 1,
      },
    ]

    window.Paddle.Checkout.open({
      settings: {
        displayMode: "overlay",
        variant: "one-page",
        theme: "dark",
        showAddDiscounts: false,
        successUrl: "https://app.usemanufactura.com",
      },
      items: itemsList,
      customer: {
        email: options.email,
      },
      customData: {
        user_id: options.userId,
      },
    })
  } catch (error) {
    console.error("Error opening Paddle checkout:", error)
    // Fallback to external pricing page
    window.open("https://app.usemanufactura.com/pricing", "_blank")
  }
}
