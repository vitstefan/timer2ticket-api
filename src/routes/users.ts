import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { databaseService } from '../shared/database_service';
import { UserToClient } from '../models/user_to_client';
import { UserFromClient } from '../models/user_from_client';
import { validate } from 'class-validator';
import { Constants } from '../shared/constants';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Time: ${Date.now()}`);

  // verify JWT

  const tokenFromHeader = req.headers["x-access-token"];

  if (!tokenFromHeader) {
    return res.sendStatus(403);
  }

  const token = Array.isArray(tokenFromHeader) ? tokenFromHeader[0] : tokenFromHeader;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt.verify(token, Constants.jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res.sendStatus(401);
    }
    res.locals.userIdFromToken = decoded.id;
    res.locals.token = token;
    next();
  });
});

/**
 * Get user with userId in parameter - needs to be 24 length string (MongoDB ObjectId)
 */
router.get('/:userId([a-zA-Z0-9]{24})', async (req, res) => {
  const userId = req.params.userId;
  const token = res.locals.token;

  // authorize if userId from JWT is the same as in userId param
  if (!res.locals.userIdFromToken || !userId || !token) {
    return res.sendStatus(400);
  }

  if (res.locals.userIdFromToken !== userId) {
    return res.sendStatus(401);
  }

  const user = await databaseService.getUserById(userId);

  if (!user) {
    return res.sendStatus(404);
  }

  // no content 204, conflict 409, bad request 400, not found 404, unauthorized 401, forbidden 403
  return res.send(new UserToClient(user, token));
});

/**
 * Updates user taken from body.user
 */
router.put('/:userId([a-zA-Z0-9]{24})', async (req, res) => {
  const userId = req.params?.userId;
  const token = res.locals?.token;

  if (!res.locals.userIdFromToken || !userId || !token) {
    return res.sendStatus(400);
  }

  const userFromClient: UserFromClient = req.body?.user;

  if (!res.locals.userIdFromToken || !userId || !token || !userFromClient) {
    return res.sendStatus(400);
  }

  // authorize if userId from JWT is the same as in userId param
  if (res.locals.userIdFromToken !== userId) {
    return res.sendStatus(401);
  }

  // validate user from client object
  const validationResults = await validate(userFromClient);
  console.log(validationResults);

  // validate correct cron schedule format (is not validated above)
  let isScheduleValid = true;
  if (userFromClient.configSyncJobDefinition) {
    isScheduleValid &&= cron.validate(userFromClient.configSyncJobDefinition.schedule);
  }
  if (userFromClient.timeEntrySyncJobDefinition) {
    isScheduleValid &&= cron.validate(userFromClient.timeEntrySyncJobDefinition.schedule);
  }

  if (validationResults.length !== 0 || isScheduleValid === false) {
    return res.sendStatus(400);
  }

  const user = await databaseService.getUserById(userId);

  if (!user) {
    return res.sendStatus(404);
  }

  if (user.status === 'registrated') {
    // set to inactive after config confirm, client should send another api request to start syncing (and status => active)
    user.status = 'inactive';
  }

  // only these properties can be changed this way
  user.configSyncJobDefinition = userFromClient.configSyncJobDefinition;
  user.timeEntrySyncJobDefinition = userFromClient.timeEntrySyncJobDefinition;
  user.serviceDefinitions = userFromClient.serviceDefinitions;

  const updatedUser = await databaseService.updateUser(user);

  if (updatedUser) {
    return res.send(new UserToClient(updatedUser, token));
  } else {
    return res.sendStatus(503);
  }
});

module.exports = router;