"use client";

import { EventMap } from "@/components/event-map";

export default function TestMapPage() {
  // Test with the exact coordinates from Stadsbiblioteket
  const stadsbiblioteketCoords = {
    lat: 58.4116252,
    lng: 15.6137005,
  };
  
  console.log("🗺️ Test page - Stadsbiblioteket coords:", stadsbiblioteketCoords);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Karta-test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="font-medium">Stadsbiblioteket (från geocoding)</h2>
          <p className="text-sm text-gray-600">
            Koordinater: {stadsbiblioteketCoords.lat}, {stadsbiblioteketCoords.lng}
          </p>
          <EventMap 
            lat={stadsbiblioteketCoords.lat} 
            lng={stadsbiblioteketCoords.lng} 
            title="Stadsbiblioteket" 
          />
        </div>
        
        <div>
          <h2 className="font-medium">Linköping Centrum (58.4108, 15.6214)</h2>
          <EventMap lat={58.4108} lng={15.6214} title="Centrum" />
        </div>
        
        <div>
          <h2 className="font-medium">Saab Arena (58.4019, 15.6215)</h2>
          <EventMap lat={58.4019} lng={15.6215} title="Saab Arena" />
        </div>
      </div>
    </main>
  );
}
