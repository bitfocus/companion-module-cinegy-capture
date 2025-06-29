import type { ModuleInstance } from './main.js'
//import { Regex } from '@companion-module/base'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		StartStopSplit: {
			name: 'Start/Stop/Split',
			options: [
				{
					id: 'method',
					type: 'dropdown',
					label: 'Select Method',
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
				await self.apiPostNoBody(extractedMethod)
			},
		},
		
JobTemplateAction: {
    name: 'Start Job with Template',
    options: [
        {
            id: 'templateId',
            type: 'dropdown',
            label: 'Select Job Template',
            default: '',
            choices: self.jobTemplatesCache, 
        },
        {
            id: 'fileName',
            type: 'textinput',
            label: 'File Name Pattern (optional)',
            default: '',
        },
        {
            id: 'clipName',
            type: 'textinput',
            label: 'Clip Name (optional)',
            default: '',
        },
        {
            id: 'tapeName',
            type: 'textinput',
            label: 'Tape Name (optional)',
            default: '',
        },
    ],
    callback: async (event) => {
        const selectedTemplateId = event.options.templateId
        const fileName = event.options.fileName
        const clipName = event.options.clipName
        const tapeName = event.options.tapeName

        const customMetadata = []

        if (fileName) {
            customMetadata.push({
                Name: "FileName",
                Value: fileName
            })
        }
        if (clipName) {
            customMetadata.push({
                Name: "ClipName",
                Value: clipName
            })
        }
        if (tapeName) {
            customMetadata.push({
                Name: "TapeName",
                Value: tapeName
            })
        }

        const body = {
            TemplateId: selectedTemplateId || undefined, 
            CustomMetadata: customMetadata.length > 0 ? customMetadata : undefined
        }

        self.log('info', `Starting capture session with payload: ${JSON.stringify(body)}`)

        const result = await self.apiPost('StartByJobTemplateIdEx', body)

        if (result) {
            self.log('info', `Capture session started successfully: ${JSON.stringify(result)}`)
        } else {
            self.log('error', `Failed to start capture session.`)
        }
    },
},
LoadJobByIdAction: {
    name: 'Load Capture Session Configuration by Template ID',
    options: [
        {
            id: 'templateId',
            type: 'dropdown',
            label: 'Select Job Template',
            default: '',
            choices: self.jobTemplatesCache, // synchron aus Cache, wie bei deiner Start-Action
        },
    ],
    callback: async (event) => {
        const selectedTemplateId = event.options.templateId

        if (!selectedTemplateId) {
            self.log('error', 'No Template ID selected for LoadJobById.')
            return
        }

        self.log('info', `Sending LoadJobById with Template ID: ${selectedTemplateId}`)

        // Hinweis: Diese API erwartet einen STRING, keine JSON-Objektstruktur.
        const result = await self.apiPost('LoadJobById', selectedTemplateId)

        if (result) {
            self.log('info', `LoadJobById executed successfully: ${JSON.stringify(result)}`)
        } else {
            self.log('error', `LoadJobById failed.`)
        }
    },
},


	
	})
}


