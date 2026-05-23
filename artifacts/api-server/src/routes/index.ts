import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import leadsRouter from "./leads";
import productsRouter from "./products";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import contactsRouter from "./contacts";

const router: IRouter = Router();

router.use(adminRouter);
router.use(healthRouter);
router.use(chatRouter);
router.use(leadsRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(contactsRouter);

export default router;
