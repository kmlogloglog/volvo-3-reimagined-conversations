declare module 'react-simple-maps' {
  import type { ComponentType, SVGProps } from 'react';

  interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string;
    projectionConfig?: ProjectionConfig;
  }

  interface GeographiesChildrenArgs {
    geographies: Array<{
      rsmKey: string;
      id: string;
      properties: Record<string, unknown>;
    }>;
  }

  interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (args: GeographiesChildrenArgs) => React.ReactNode;
  }

  interface GeographyStyleProps {
    default?: React.CSSProperties;
    hover?: React.CSSProperties;
    pressed?: React.CSSProperties;
  }

  interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: Record<string, unknown>;
    style?: GeographyStyleProps;
  }

  interface MarkerProps extends SVGProps<SVGGElement> {
    coordinates: [number, number];
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const Marker: ComponentType<MarkerProps>;
}
