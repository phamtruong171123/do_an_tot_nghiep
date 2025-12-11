import { Router } from "express";
import { authRequired } from "../../middleware/auth";
import {
  listCustomersHandler,
  getCustomerHandler,
  updateCustomerHandler,
  createCustomer,
} from "./customer.controller";

const router = Router();

// Danh sách khách hàng
router.get("/", authRequired, listCustomersHandler);

// Chi tiết 1 khách hàng
router.get("/:id", authRequired, getCustomerHandler);

// Tạo khách hàng
router.post("/", authRequired, createCustomer);

// Cập nhật thông tin khách hàng (name, note)
router.patch("/:id", authRequired, updateCustomerHandler);

export default router;
