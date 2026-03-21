import { useParams, useLocation } from "wouter";
import { useProperty } from "@/hooks/use-properties";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import logoPng from "@assets/vendortrust-full-nobg.png";

export default function PrintFlyer() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const id = parseInt(propertyId || "0");
  const [, setLocation] = useLocation();
  const { data: property, isLoading } = useProperty(id);

  const reportUrl = `${window.location.origin}/report/${id}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
          <Button onClick={() => setLocation("/properties")} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation("/properties")} data-testid="button-back-properties">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
        </Button>
        <Button onClick={() => window.print()} data-testid="button-print-flyer">
          <Printer className="mr-2 h-4 w-4" /> Print Flyer
        </Button>
      </div>

      <div className="max-w-[8.5in] mx-auto p-6 print:p-0">
        <div className="bg-white rounded-3xl print:rounded-none shadow-xl print:shadow-none border border-border print:border-0 overflow-hidden">
          <div className="bg-gradient-to-br from-green-800 to-green-950 text-white p-8 sm:p-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logoPng} alt="VendorTrust" className="h-14 w-14 rounded-xl" />
              <span className="text-3xl sm:text-4xl font-bold tracking-tight">VendorTrust</span>
            </div>
            <div className="w-16 h-1 bg-white/40 rounded-full mx-auto mb-4"></div>
            <p className="text-green-200 text-lg">Fast. Easy. Maintenance Reporting.</p>
          </div>

          <div className="p-8 sm:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Need Something Fixed?</h2>
              <p className="text-gray-500 text-lg">Report maintenance issues in under 2 minutes.</p>
            </div>

            <div className="flex flex-col items-center mb-10">
              <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-green-200 inline-block mb-4">
                <QRCodeSVG
                  value={reportUrl}
                  size={240}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm text-gray-400 font-mono break-all max-w-xs text-center">{reportUrl}</p>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 sm:p-8 mb-8 border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">How It Works</h3>
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="h-12 w-12 rounded-full bg-green-800 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                  <p className="font-semibold text-gray-800 mb-1">Scan the Code</p>
                  <p className="text-sm text-gray-500">Open your phone camera and point it at the QR code above.</p>
                </div>
                <div>
                  <div className="h-12 w-12 rounded-full bg-green-800 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                  <p className="font-semibold text-gray-800 mb-1">Describe the Issue</p>
                  <p className="text-sm text-gray-500">Fill out the form with details and take a photo if you can.</p>
                </div>
                <div>
                  <div className="h-12 w-12 rounded-full bg-green-800 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                  <p className="font-semibold text-gray-800 mb-1">We'll Handle It</p>
                  <p className="text-sm text-gray-500">Your landlord gets notified instantly and will follow up.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">This flyer is for tenants of</p>
              <p className="text-xl font-bold text-gray-900">{property.name}</p>
              <p className="text-sm text-gray-500">{property.address}</p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">No app download required. Works on any smartphone browser.</p>
              <p className="text-xs text-gray-400 mt-1">Powered by VendorTrust</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
