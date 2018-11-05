'use strict';

import GitlabService from './gitlabService';
import { ProjectsBundle } from 'gitlab';

jest.mock('gitlab');
const gitlabMock = new ProjectsBundle();

describe('processLabel', () => {
    it('should process label without bypassing', async () => {
        gitlabMock.MergeRequests = {
            show: jest.fn().mockResolvedValue({
                labels: ['mergeable'],
                target_branch: 'master',
            }),
        };
        gitlabMock.Commits = { editStatus: jest.fn().mockResolvedValue() };
        const githubService = new GitlabService(gitlabMock);

        const status = await githubService.processLabel('tiste/sheriff', 3, 'mergeable', 'master');

        expect(gitlabMock.Commits.editStatus).toHaveBeenCalled();
        expect(status).toEqual({
            bypass: false,
            description: 'The "mergeable" label is attached, go for it',
            isSuccess: true,
        });
    });

    it('should process label but bypass', async () => {
        gitlabMock.MergeRequests = {
            show: jest.fn().mockResolvedValue({
                labels: ['mergeable'],
                target_branch: 'develop',
            }),
        };
        gitlabMock.Commits = { editStatus: jest.fn().mockResolvedValue() };
        const githubService = new GitlabService(gitlabMock);

        const status = await githubService.processLabel('tiste/sheriff', 3, 'mergeable', 'master');

        expect(gitlabMock.Commits.editStatus).not.toHaveBeenCalled();
        expect(status).toEqual({
            bypass: true,
            description: 'The "mergeable" label is attached, go for it',
            isSuccess: true,
        });
    });

    it('should process label with failure', async () => {
        gitlabMock.MergeRequests = {
            show: jest.fn().mockResolvedValue({
                labels: ['goforit'],
                target_branch: 'master',
            }),
        };
        gitlabMock.Commits = { editStatus: jest.fn().mockResolvedValue() };
        const githubService = new GitlabService(gitlabMock);

        const status = await githubService.processLabel('tiste/sheriff', 3, 'mergeable', 'master');

        expect(gitlabMock.Commits.editStatus).toHaveBeenCalled();
        expect(status).toEqual({
            bypass: false,
            description: 'Pull Request doesn\'t have the label \"mergeable\" yet',
            isSuccess: false,
        });
    });
});

describe('processCommitMsg', () => {
    it('should process label without bypassing', async () => {
        gitlabMock.MergeRequests = {
            show: jest.fn().mockResolvedValue({
                target_branch: 'master',
            }),
            commits: jest.fn().mockResolvedValue([
                { title: 'feat: ok' },
                { title: 'fix: super' },
            ]),
        };
        gitlabMock.Commits = { editStatus: jest.fn().mockResolvedValue() };
        const githubService = new GitlabService(gitlabMock);

        const status = await githubService.processCommitMsg('tiste/sheriff', 3, 'master');

        expect(gitlabMock.Commits.editStatus).toHaveBeenCalled();
        expect(status).toEqual({
            bypass: false,
            description: 'All commit messages are okay',
            isSuccess: true,
        });
    });

    it('should process label but bypass', async () => {
        gitlabMock.MergeRequests = {
            show: jest.fn().mockResolvedValue({
                target_branch: 'develop',
            }),
            commits: jest.fn().mockResolvedValue([
                { title: 'feat: ok' },
                { title: 'fix: super' },
            ]),
        };
        gitlabMock.Commits = { editStatus: jest.fn().mockResolvedValue() };
        const githubService = new GitlabService(gitlabMock);

        const status = await githubService.processCommitMsg('tiste/sheriff', 3, 'master');

        expect(gitlabMock.Commits.editStatus).not.toHaveBeenCalled();
        expect(status).toEqual({
            bypass: true,
            description: 'All commit messages are okay',
            isSuccess: true,
        });
    });

    it('should process label with 3 failures', async () => {
        gitlabMock.MergeRequests = {
            show: jest.fn().mockResolvedValue({
                target_branch: 'master',
            }),
            commits: jest.fn().mockResolvedValue([
                { title: 'feat: Nok' },
                { title: 'feat:nok' },
                { title: 'hello' },
            ]),
        };
        gitlabMock.Commits = { editStatus: jest.fn().mockResolvedValue() };
        const githubService = new GitlabService(gitlabMock);

        const status = await githubService.processCommitMsg('tiste/sheriff', 3, 'master');

        expect(gitlabMock.Commits.editStatus).toHaveBeenCalled();
        expect(status).toEqual({
            bypass: false,
            description: 'Some commits (3) have invalid messages',
            isSuccess: false,
        });
    });
});

describe('processBranch', () => {
    it('should process branch', async () => {
        gitlabMock.MergeRequests = {
            show: jest.fn().mockResolvedValue({}),
        };
        gitlabMock.Commits = { editStatus: jest.fn().mockResolvedValue() };
        const githubService = new GitlabService(gitlabMock);

        const status = await githubService.processBranch('tiste/sheriff', 3, 'super-JIRA-01', '*-JIRA-*');

        expect(gitlabMock.Commits.editStatus).toHaveBeenCalled();
        expect(status).toEqual({
            bypass: false,
            description: 'The branch name is okay',
            isSuccess: true,
        });
    });

    it('should process branch with failure', async () => {
        gitlabMock.MergeRequests = {
            show: jest.fn().mockResolvedValue({}),
        };
        gitlabMock.Commits = { editStatus: jest.fn().mockResolvedValue() };
        const githubService = new GitlabService(gitlabMock);

        const status = await githubService.processBranch('tiste/sheriff', 3, 'super-JIRA67', '*-JIRA-*');

        expect(gitlabMock.Commits.editStatus).toHaveBeenCalled();
        expect(status).toEqual({
            bypass: false,
            description: 'The branch name doesn\'t match the pattern',
            isSuccess: false,
        });
    });
});