import {ExtensionAssetBuildStatus} from './payload/models.js'
import {GetUIExtensionPayloadOptions} from './payload.js'
import {UIExtension} from '../../../models/app/extensions.js'
import {path, output} from '@shopify/cli-kit'
import {readFile} from '@shopify/cli-kit/node/fs'

export type Locale = string

export interface Localization {
  // TOOD: Should this be strongly typed?
  defaultLocale: Locale
  translations: {
    [key: Locale]: {[key: string]: string}
  }
  lastUpdated: number
}

export async function getLocalizationFilePaths(extension: UIExtension): Promise<string[]> {
  const localePath = path.join(extension.directory, 'locales')
  return path.glob([path.join(localePath, '*.json')])
}

export async function getLocalization(
  extension: UIExtension,
  options: GetUIExtensionPayloadOptions,
): Promise<{localization: Localization | undefined; status: ExtensionAssetBuildStatus}> {
  const localeFiles = await getLocalizationFilePaths(extension)

  if (!localeFiles.length) {
    return {localization: undefined, status: ''}
  }

  const localization = options.currentLocalizationPayload
    ? options.currentLocalizationPayload
    : ({
        defaultLocale: 'en',
        translations: {},
        lastUpdated: 0,
      } as Localization)

  let status: ExtensionAssetBuildStatus = 'success'

  try {
    await Promise.all(
      localeFiles.map(async (localeFile) => {
        const [locale, ...fileNameSegments] = (localeFile.split('/').pop() as string).split('.')

        if (locale) {
          if (fileNameSegments[0] === 'default') {
            localization.defaultLocale = locale
          }

          return compileLocalizationFiles(locale, localeFile, localization, extension, options)
        }
      }),
    )
    localization.lastUpdated = Date.now()
    output.info(
      `Parsed locales for extension ${extension.configuration.name} at ${extension.directory}`,
      options.stdout,
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-catch-all/no-catch-all
  } catch (error: any) {
    status = 'error'
  }

  return {
    localization,
    status,
  }
}

async function compileLocalizationFiles(
  locale: string,
  path: string,
  localization: Localization,
  extension: UIExtension,
  options: GetUIExtensionPayloadOptions,
): Promise<void> {
  let localeContent: string | undefined
  try {
    localeContent = await readFile(path)
    localization.translations[locale] = JSON.parse(localeContent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const message = `Error parsing ${locale} locale for ${extension.configuration.name} at ${path}: ${error.message}`
    output.warn(message, options.stderr)
    throw new error.ExtendableError(message)
  }
}
