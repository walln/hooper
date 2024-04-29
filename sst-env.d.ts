import "sst"
declare module "sst" {
  export interface Resource {
    OpenAiApiKey: {
      type: "sst.sst.Secret"
      value: string
    }
    AuthSecret: {
      type: "sst.sst.Secret"
      value: string
    }
    TursoURL: {
      type: "sst.sst.Secret"
      value: string
    }
    TursoToken: {
      type: "sst.sst.Secret"
      value: string
    }
  }
}
export {}