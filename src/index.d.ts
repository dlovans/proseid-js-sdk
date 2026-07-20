export type ThemeName = 'light' | 'charcoal' | 'midnight' | 'forest';
export type FlowType = 'form' | 'guided_assessment' | 'determination' | 'checklist';
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
	/** Preview/loading preference. A production Flow's saved attribution is authoritative. */
	proseid?: 'full' | 'compact' | 'hidden';
}

export interface SigningAdapter {
	sign(nextAction: Record<string, unknown>, context: { manifest: EmbedManifest; values: Record<string, unknown> }): Promise<unknown>;
}

export interface MountOptions {
	flow: `${string}/${string}`;
	/** Browser-safe `proseid_pk_…` key identifying the organization that owns the Flow. */
	apiKey: string;
	apiBase?: string;
	/** Curated loading/test fallback. A production Flow's saved theme is authoritative. */
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
	onSigning?: (detail: { mode: string; signature?: unknown; nextAction?: Record<string, unknown> }) => void;
	onComplete?: (result: CompletionResult) => void;
	onReceipt?: (result: ReceiptResult) => void;
	onError?: (error: Error) => void;
}

export interface EmbedManifest {
	apiVersion: string;
	flow: { ref: string; flowType: FlowType; title: string; description: string; schemaId: string; schemaVersion: string; effectiveAt: string; temporalContext?: { effective_at: string; logic_version: string | null; valid_range: [string | null, string | null] | null } | null; completionBinding?: string };
	publisher: { slug: string; name: string; logo: string | null; verified: boolean };
	schema: {
		title?: string;
		description?: string;
		metadata?: {
			description?: string;
			jurisdictions?: string[];
			legal_references?: Array<{ instrument?: string; provision?: string; source_url?: string }>;
		};
		definitions: Record<string, Record<string, unknown>>;
	};
	branding: { proseid: { name: string; logo: string; url: string } };
	/** Frozen Flow price. Monetary fields are integer microns: 1,000 microns = US$1. */
	presentation: { theme?: ThemeName; attribution: 'full' | 'compact' | 'hidden'; whiteLabel: boolean; completionMicrons: number; surchargeMicrons: number; testMode?: boolean };
	capabilities: {
		validation: 'remote';
		auditRecord: boolean;
		receiptEmail: boolean;
		testMode?: boolean;
		signing: {
			requested: boolean;
			available: boolean;
			provider: string | null;
			mode: 'none' | 'basic' | 'coming_soon' | string;
		};
	};
}

export interface ReceiptResult {
	status: 'sent' | 'error';
	recordId: string;
	email: string;
	error?: Error;
}

export interface CompletionResult {
	ok: true;
	status: 'completed';
	recordId: string;
	effectiveAt: string;
	logicVersion: string | null;
	temporalRange: [string | null, string | null] | null;
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
export declare function mountTest(target: string | Element, options: Omit<MountOptions, 'flow'> & { flow?: never }): ProseIDForm;
export declare function mountAll(defaults?: Partial<MountOptions>): ProseIDForm[];
