import {DeployConfig, ReqDeployConfig} from './types.js'
import {gitInit} from '../../prompts/git-init.js'
import {error, path} from '@shopify/cli-kit'
import {
  addAllToGitFromDirectory,
  createGitCommit,
  createGitIgnore,
  ensureGitIsPresentOrAbort,
  ensureInsideGitDirectory,
  getHeadSymbolicRef,
  getLatestGitCommit,
  GitIgnoreTemplate,
  initializeGitRepository,
  OutsideGitDirectoryError,
} from '@shopify/cli-kit/node/git'

const MINIMAL_GIT_IGNORE: GitIgnoreTemplate = {
  system: ['.DS_Store'],
  logs: ['logs', '*.log', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*'],
  testing: ['/coverage', '*.lcov'],
  dependencies: ['/node_modules', '.npm', '.yarn-integrity', '/.pnp', '.pnp.js'],
  typescript: ['*.tsbuildinfo'],
  environment: ['.env', '.env.test', '.env.local'],
  production: ['/dist'],
}

export const validateProject = async (config: DeployConfig) => {
  await ensureGitIsPresentOrAbort()
  try {
    await ensureInsideGitDirectory(config.path)
  } catch (err: unknown) {
    if (err instanceof OutsideGitDirectoryError) {
      await initializeGit(config)
    } else {
      throw err
    }
  }
}

export const initializeGit = async (config: DeployConfig) => {
  if (!config.assumeYes) {
    const shouldGitInit = await gitInit()
    if (!shouldGitInit) throw new error.AbortSilent()
  }

  await initializeGitRepository(config.path)
  createGitIgnore(config.path, MINIMAL_GIT_IGNORE)
  await addAllToGitFromDirectory(config.path)
  await createGitCommit('Initial commit generated by Hydrogen', {directory: config.path})
}

export const fillDeployConfig = async (config: DeployConfig): Promise<ReqDeployConfig> => {
  const [latestCommit, commitRef] = await Promise.all([
    getLatestGitCommit(config.path),
    getHeadSymbolicRef(config.path),
  ])

  return {
    ...config,
    pathToBuild: config.pathToBuild ? path.resolve(config.pathToBuild) : '',
    commitMessage: config.commitMessage ?? latestCommit.message,
    commitAuthor: config.commitAuthor ?? latestCommit.author_name,
    commitSha: latestCommit.hash,
    timestamp: latestCommit.date,
    commitRef,
  }
}
