/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
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