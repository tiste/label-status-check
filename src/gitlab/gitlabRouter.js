'use strict';

import express from 'express';
import passport from 'passport';
import Gitlab from './gitlab';

const router = express.Router();

router.get('/login', passport.authenticate('gitlab'));

router.get('/callback', passport.authenticate('gitlab', { failureRedirect: '/' }), (req, res) => {

    res.redirect('/?token=' + req.user.token);
});

router.post('/label', passport.authenticate('localapikey'), (req, res, next) => {

    if (['Merge Request Hook'].includes(req.get('x-gitlab-event'))) {

        const pullRequest = req.body;
        const label = req.query.name;
        const baseBranch = req.query.branch;

        const gitlab = new Gitlab(req.user.accessToken);
        return gitlab.processLabel(pullRequest.object_attributes.source_project_id, pullRequest.object_attributes.id, label, baseBranch).then((status) => {
            res.send(status);
        }).catch(next);
    }

    res.sendStatus(200);
});

router.post('/commit-msg', passport.authenticate('localapikey'), (req, res, next) => {

    if (['Merge Request Hook'].includes(req.get('x-gitlab-event'))) {

        const pullRequest = req.body;
        const baseBranch = req.query.branch;

        const gitlab = new Gitlab(req.user.accessToken);
        return gitlab.processCommitMsg(pullRequest.object_attributes.source_project_id, pullRequest.object_attributes.id, baseBranch).then((status) => {
            res.send(status);
        }).catch(next);
    }

    res.sendStatus(200);
});

router.post('/branch', passport.authenticate('localapikey'), (req, res, next) => {

    if (['Merge Request Hook'].includes(req.get('x-gitlab-event'))) {

        const pullRequest = req.body;
        const pattern = req.query.pattern;

        const gitlab = new Gitlab(req.user.accessToken);
        return gitlab.processBranch(pullRequest.object_attributes.source_project_id, pullRequest.object_attributes.id, pullRequest.object_attributes.source_branch, pattern).then((status) => {
            res.send(status);
        }).catch(next);
    }

    res.sendStatus(200);
});

export default router;
