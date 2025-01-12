import {zip} from './archiver.js'
import {fileExists, inTemporaryDirectory, mkdir, touchFile} from './fs.js'
import {join as joinPath, dirname} from '../../path.js'
import {describe, expect, test} from 'vitest'
import StreamZip from 'node-stream-zip'

describe('zip', () => {
  test('zips a directory', async () => {
    await inTemporaryDirectory(async (tmpDir) => {
      // Given
      const zipPath = joinPath(tmpDir, 'output.zip')
      const outputDirectoryName = 'output'
      const outputDirectoryPath = joinPath(tmpDir, outputDirectoryName)
      const structure = [`extensions/first/main.js`, `test.json`]

      for (const fileRelativePath of structure) {
        const filePath = joinPath(tmpDir, outputDirectoryName, fileRelativePath)
        // eslint-disable-next-line no-await-in-loop
        await mkdir(dirname(filePath))
        // eslint-disable-next-line no-await-in-loop
        await touchFile(filePath)
      }

      // When
      await zip(outputDirectoryPath, zipPath)

      // Then
      await expect(fileExists(zipPath)).resolves.toBeTruthy()
      // eslint-disable-next-line @babel/new-cap
      const archive = new StreamZip.async({file: zipPath})
      const archiveEntries = Object.keys(await archive.entries())
      expect(structure.sort()).toEqual(archiveEntries.sort())
      await archive.close()
    })
  })
})
