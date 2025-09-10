import { connectToDot } from "./connectors";

export const getApi = () => {
  return connectToDot();
}
