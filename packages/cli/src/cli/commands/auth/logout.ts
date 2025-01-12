import Command from '@shopify/cli-kit/node/base-command'
import {output} from '@shopify/cli-kit'
import {logout} from '@shopify/cli-kit/node/session'

export default class Logout extends Command {
  static description = 'Logout from Shopify.'

  async run(): Promise<void> {
    await logout()
    output.success('Logged out from Shopify')
  }
}
