import { Router } from "express";
import posRouter from './POS/index';

const route = Router();

route.use('/pos', posRouter);


export default route;