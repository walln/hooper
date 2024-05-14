/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    ResendApiKey: {
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