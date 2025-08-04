import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PricingTableComponent } from '@/components/pricing-table';
import { BillingDebug } from '@/components/billing-debug';

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-4xl font-bold">Choose Your Plan</CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            Unlock the full potential of your flashcard learning experience. 
            Choose the plan that best fits your study needs.
          </CardDescription>
        </CardHeader>
        
        <Separator className="my-6" />
        
        <CardContent className="p-8">
          <PricingTableComponent />
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && <BillingDebug />}
        </CardContent>
      </Card>
    </div>
  );
}