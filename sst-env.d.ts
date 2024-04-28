import "sst";
declare module "sst" {
	export interface Resource {
		TursoURL: {
			type: "sst.sst.Secret";
			value: string;
		};
		TursoToken: {
			type: "sst.sst.Secret";
			value: string;
		};
		OpenAiApiKey: {
			type: "sst.sst.Secret";
			value: string;
		};
		AuthSecret: {
			type: "sst.sst.Secret";
			value: string;
		};
	}
}
export {};
