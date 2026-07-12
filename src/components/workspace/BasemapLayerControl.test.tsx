import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { useDesignStore } from "@/lib/store";
import { BasemapLayerControl } from "./BasemapLayerControl";
import type { BasemapFeature } from "@/lib/types";

describe("BasemapLayerControl", () => {
  beforeEach(() => {
    const mockParcel = { id: "R1", type: "Feature" as const, geometry: null as unknown as GeoJSON.Geometry, properties: {} } as unknown as BasemapFeature;
    const mockParcel2 = { id: "R2", type: "Feature" as const, geometry: null as unknown as GeoJSON.Geometry, properties: {} } as unknown as BasemapFeature;
    const mockAddress = { id: "A1", type: "Feature" as const, geometry: null as unknown as GeoJSON.Geometry, properties: {} } as unknown as BasemapFeature;
    useDesignStore.setState({
      basemapData: {
        parcels: [mockParcel, mockParcel2],
        addresses: [mockAddress],
      },
      refParcelsVisible: true,
      refAddressesVisible: true,
    });
  });

  it("renders feature counts from basemapData", () => {
    render(React.createElement(BasemapLayerControl));
    expect(screen.getByText("(2)")).toBeTruthy();
    expect(screen.getByText("(1)")).toBeTruthy();
  });

  it("toggles parcel visibility in the store on click", () => {
    render(React.createElement(BasemapLayerControl));
    const parcelsButton = screen.getByText("Parcels").closest("button")!;
    fireEvent.click(parcelsButton);
    expect(useDesignStore.getState().refParcelsVisible).toBe(false);
    fireEvent.click(parcelsButton);
    expect(useDesignStore.getState().refParcelsVisible).toBe(true);
  });

  it("toggles address visibility in the store on click", () => {
    render(React.createElement(BasemapLayerControl));
    const addressesButton = screen.getByText("Addresses").closest("button")!;
    fireEvent.click(addressesButton);
    expect(useDesignStore.getState().refAddressesVisible).toBe(false);
  });
});
