export interface FoldoutOption {
    id: string;
    label: string;
    icon: string;
    active?: boolean;
    disabled?: boolean;
}

export interface GradientStop {
    position: number;
    r: number;
    g: number;
    b: number;
    a: number;
}
