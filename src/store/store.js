import { configureStore } from "@reduxjs/toolkit";
import invoiceReducer from "./slices/invoiceSlice";
import customerReducer from "./slices/customerSlice";
import productReducer from "./slices/productSlice";

export const store = configureStore({
  reducer: {
    invoice: invoiceReducer,
    customer: customerReducer,
    product: productReducer
  }
});
