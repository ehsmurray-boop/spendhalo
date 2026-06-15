import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import transactionsRouter from "./transactions";
import moodLogsRouter from "./moodLogs";
import whatIfRouter from "./whatIf";
import insightsRouter from "./insights";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(transactionsRouter);
router.use(moodLogsRouter);
router.use(whatIfRouter);
router.use(insightsRouter);
router.use(stripeRouter);

export default router;
