export type ThemeName = 'light' | 'charcoal' | 'midnight' | 'forest';
export type AppearancePreset = 'soft' | 'capsule' | 'rigid' | 'underline';
export interface Appearance {
	preset?: AppearancePreset;
	shape?: 'soft' | 'capsule' | 'rigid';
	fields?: 'outlined' | 'underline';
	shell?: 'card' | 'flat';
	density?: 'comfortable' | 'compact';
}
export interface Branding {
	/** Safe HTTPS image URL. Falls back to the publisher's ProseID organization logo. */
	logoUrl?: string;
	logoAlt?: string;
	/** `hidden` removes ProseID attribution and adds the server-enforced white-label completion surcharge. */
	proseid?: 'full' | 'compact' | 'hidden';
}

export interface SigningAdapter {
	sign(nextAction: Record<string, unknown>, context: { manifest: EmbedManifest; values: Record<string, unknown> }): Promise<unknown>;
}

export interface MountOptions {
	form: `${string}/${string}`;
	/** Browser-safe `proseid_pk_…` key identifying the organization that owns the form. */
	apiKey: string;
	apiBase?: string;
	/** Curated, contrast-tested palette. Arbitrary color values are intentionally unsupported. */
	theme?: ThemeName;
	appearance?: AppearancePreset | Appearance;
	branding?: Branding;
	nonce?: string;
	validateDelay?: number;
	locale?: 'en' | 'sv' | string;
	messages?: Record<string, string | ((value: string) => string)>;
	submitLabel?: string;
	signingAdapter?: SigningAdapter;
	fetch?: typeof fetch;
	onReady?: (detail: { manifest: EmbedManifest }) => void;
	onChange?: (detail: { name: string; value: unknown; values: Record<string, unknown> }) => void;
	onValidation?: (detail: { valid: boolean; status: string; issues: unknown[] }) => void;
	onSubmit?: (detail: { values: Record<string, unknown> }) => void;
	onComplete?: (result: CompletionResult) => void;
	onError?: (error: Error) => void;
}

export interface EmbedManifest {
	apiVersion: string;
	form: { ref: string; title: string; description: string; schemaId: string; schemaVersion: string };
	publisher: { slug: string; name: string; logo: string | null; verified: boolean };
	schema: { definitions: Record<string, Record<string, unknown>> };
	branding: { proseid: { name: string; logo: string; url: string } };
	presentation: { attribution: 'full' | 'compact' | 'hidden'; whiteLabel: boolean; completionMicrons: number; surchargeMicrons: number; testMode?: boolean };
	capabilities: { validation: 'remote'; auditRecord: boolean; signing: Record<string, unknown> };
}

export interface CompletionResult {
	ok: true;
	status: 'completed';
	sessionId: string;
	duplicate: boolean;
	delivered: { email: boolean; webhook: boolean };
	nextAction: Record<string, unknown> | null;
	test?: boolean;
}

export declare class ProseIDError extends Error { code: string; status: number; details: Record<string, unknown>; }
export declare class ProseIDForm {
	readonly ready: Promise<ProseIDForm>;
	readonly valid: boolean;
	readonly manifest: EmbedManifest;
	validate(): Promise<unknown>;
	destroy(): void;
}
export declare const VERSION: string;
export declare const THEME_NAMES: readonly ThemeName[];
export declare function mount(target: string | Element, options: MountOptions): ProseIDForm;
export declare function mountTest(target: string | Element, options: Omit<MountOptions, 'form'> & { form?: never }): ProseIDForm;
export declare function mountAll(defaults?: Partial<MountOptions>): ProseIDForm[];
