import { getRandom } from './macros/rand' with { type: 'macro' }
import { inc } from './macros/inc' with { type: 'macro' }
import { foo } from './macros/var' with { type: 'macro' }

getRandom() === 0.5
inc() === 1
inc() === 2
inc() === 3
foo === 1

const { bar = foo } = {}
