import type { ModuleInstance } from './main.js'
//import { Regex } from '@companion-module/base'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		sendTextMessage: {
			name: 'Start/Stop/Split',
			options: [
				{
					id: 'method',
					type: 'dropdown',
					label: 'Selecht Method',
					choices: [
						{ id: 'Start', label: 'Start' },
						{ id: 'Stop', label: 'Stop' },
						{ id: 'Split', label: 'Split' },
					],
					default: 'Start'
				}
			],
			callback: async (event) => {
				const o = event.options
				const extractedMethod = await self.parseVariablesInString(o.method as string)
				await self.apiGet(extractedMethod)
			},
		},

	
	})
}
