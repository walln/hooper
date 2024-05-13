/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    Auth: {
      publicKey: string
      type: "sst.aws.Auth"
    }
    AuthSecret: {
      type: "sst.sst.Secret"
      value: string
    }
    OpenAiApiKey: {
      type: "sst.sst.Secret"
      value: string
    }
    TursoToken: {
      type: "sst.sst.Secret"
      value: string
    }
    TursoURL: {
      type: "sst.sst.Secret"
      value: string
    }
  }
}
export {}