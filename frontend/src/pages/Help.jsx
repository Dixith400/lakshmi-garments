import React from 'react';
import { Search, Heart, ShoppingCart, MapPin, CreditCard, PackageCheck } from 'lucide-react';

const steps = [
  { icon: Search, title: '1. Browse or Search', text: 'Use the search bar or Categories on the homepage to find a product.' },
  { icon: Heart, title: '2. Pick a Product', text: "Open a product, choose size/color if shown, then Add to Cart or save it to your Wishlist." },
  { icon: ShoppingCart, title: '3. Review Your Cart', text: 'Open the cart icon to check items and quantities before checkout.' },
  { icon: MapPin, title: '4. Add a Shipping Address', text: 'Select a saved address or add a new one under Addresses.' },
  { icon: CreditCard, title: '5. Checkout & Pay', text: "Click Checkout & Pay — you'll be securely redirected to Razorpay to complete payment." },
  { icon: PackageCheck, title: '6. Track Your Order', text: 'Visit My Orders anytime to see your order status.' },
];

export default function Help() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">How to Place an Order</h1>
      <div className="space-y-5">
        {steps.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={20} className="text-brand" />
              <h2 className="font-semibold text-ink">{s.title}</h2>
            </div>
            <p className="text-ink/70 text-sm">{s.text}</p>
            {/* To add a real screenshot for this step later, put the image
                in frontend/public/help/step1.png (etc.) and uncomment: */}
            {/* <img src={`/help/step${i + 1}.png`} className="w-full rounded-xl mt-3 border border-ink/10" alt="" /> */}
          </div>
        ))}
      </div>
    </div>
  );
}