export const manifest = {
	ok: true,
	apiVersion: '2026-07-16',
	flow: { ref: 'flow_1', flowType: 'form', title: 'Client intake', description: 'Complete this record.', schemaId: 'schema_1', schemaVersion: '1.0.0', effectiveAt: '2026-07-16' },
	publisher: { slug: 'acme', name: 'Acme Legal', logo: null },
	author: { username: 'ada', verified: true },
	branding: { proseid: { name: 'ProseID', logo: 'https://proseid.com/icon-192.png', url: 'https://proseid.com' } },
	presentation: { attribution: 'full', whiteLabel: false, completionMicrons: 200, surchargeMicrons: 0 },
	schema: { definitions: { full_name: { type: 'string', label: 'Full name', required: true } } },
	capabilities: { validation: 'remote', auditRecord: true, receiptEmail: true, signing: { requested: false, available: false, mode: 'none' } }
};

export const response = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

export const API_KEY = `proseid_pk_${'a'.repeat(40)}`;
