'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { AutomationTrigger } from '@prisma/client'
import { ActionType } from '@/lib/automation/types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  trigger: z.nativeEnum(AutomationTrigger),
  priority: z.number().int().min(0).max(999),
  isActive: z.boolean(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
    value: z.any(),
    logic: z.enum(['AND', 'OR']).optional()
  })),
  actions: z.array(z.object({
    type: z.nativeEnum(ActionType),
    params: z.record(z.any())
  }))
})

type FormValues = z.infer<typeof formSchema>

interface RuleFormProps {
  rule?: any
  onSubmit: (data: FormValues) => Promise<void>
}

const triggerFields: Record<AutomationTrigger, string[]> = {
  INQUIRY_CREATED: ['inquiry.title', 'inquiry.priority', 'customer.name'],
  INQUIRY_STATUS_CHANGED: ['oldStatus', 'newStatus', 'inquiry.title'],
  ITEM_ASSIGNED: ['item.name', 'assignedTo.role', 'inquiry.priority'],
  COST_CALCULATED: ['totalCost', 'item.name', 'calculatedBy.role'],
  APPROVAL_REQUIRED: ['entityType', 'approver.role'],
  QUOTE_CREATED: ['quote.total', 'customer.name'],
  DEADLINE_APPROACHING: ['daysUntilDue', 'entityType', 'isOverdue'],
  WORKLOAD_THRESHOLD: ['role'],
  PRODUCTION_ORDER_CREATED: ['order.totalValue', 'customer.name']
}

const actionParams: Record<ActionType, any> = {
  ASSIGN_TO_USER: { userId: '', entityType: 'inquiry', entityId: '' },
  ASSIGN_TO_ROLE: { role: '', entityType: 'inquiry', balanceWorkload: true },
  SEND_EMAIL: { templateName: '', to: '', variables: {} },
  CREATE_NOTIFICATION: { userId: '', type: 'STATUS_UPDATE', title: '', message: '' },
  UPDATE_STATUS: { entityType: 'inquiry', status: '' },
  CREATE_DEADLINE: { entityType: 'INQUIRY', daysFromNow: 7, warningDays: 3 },
  ESCALATE: { title: 'Escalation Required', message: '' },
  CREATE_TASK: { title: '', description: '', assignTo: '' },
  TRIGGER_WEBHOOK: { url: '', method: 'POST', headers: {}, body: {} }
}

export function RuleForm({ rule, onSubmit }: RuleFormProps) {
  const t = useTranslations()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: rule || {
      name: '',
      description: '',
      trigger: AutomationTrigger.INQUIRY_CREATED,
      priority: 0,
      isActive: true,
      conditions: [],
      actions: []
    }
  })

  const handleSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await onSubmit(data)
      toast.success(rule ? t('automation.rules.updated') : t('automation.rules.created'))
      router.push('/dashboard/automation')
    } catch (error) {
      toast.error(t('automation.rules.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const addCondition = () => {
    const conditions = form.getValues('conditions')
    form.setValue('conditions', [
      ...conditions,
      { field: '', operator: 'equals' as const, value: '', logic: 'AND' as const }
    ])
  }

  const removeCondition = (index: number) => {
    const conditions = form.getValues('conditions')
    form.setValue('conditions', conditions.filter((_, i) => i !== index))
  }

  const addAction = () => {
    const actions = form.getValues('actions')
    form.setValue('actions', [
      ...actions,
      { type: ActionType.CREATE_NOTIFICATION, params: { ...actionParams[ActionType.CREATE_NOTIFICATION] } }
    ])
  }

  const removeAction = (index: number) => {
    const actions = form.getValues('actions')
    form.setValue('actions', actions.filter((_, i) => i !== index))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('automation.rules.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('automation.rules.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('automation.rules.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('automation.rules.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('automation.rules.descriptionPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trigger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('automation.rules.triggerEvent')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('automation.rules.selectTrigger')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AutomationTrigger).map(trigger => (
                          <SelectItem key={trigger} value={trigger}>
                            {trigger.split('_').join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('automation.rules.priority')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="999"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('automation.rules.priorityDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>{t('automation.rules.active')}</FormLabel>
                    <FormDescription>
                      {t('automation.rules.activeDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('automation.rules.conditions')}</CardTitle>
                <CardDescription>
                  {t('automation.rules.conditionsDescription')}
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-2" />
                {t('automation.rules.addCondition')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {form.watch('conditions').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('automation.rules.noConditions')}
              </p>
            ) : (
              <div className="space-y-4">
                {form.watch('conditions').map((_, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`conditions.${index}.field`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t('automation.rules.field')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('automation.rules.selectField')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {triggerFields[form.watch('trigger')]?.map(f => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`conditions.${index}.operator`}
                      render={({ field }) => (
                        <FormItem className="w-40">
                          <FormLabel>{t('automation.rules.operator')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="equals">{t('automation.operators.equals')}</SelectItem>
                              <SelectItem value="not_equals">{t('automation.operators.notEquals')}</SelectItem>
                              <SelectItem value="contains">{t('automation.operators.contains')}</SelectItem>
                              <SelectItem value="greater_than">{t('automation.operators.greaterThan')}</SelectItem>
                              <SelectItem value="less_than">{t('automation.operators.lessThan')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`conditions.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t('automation.rules.value')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {index < form.watch('conditions').length - 1 && (
                      <FormField
                        control={form.control}
                        name={`conditions.${index}.logic`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormLabel>{t('automation.rules.logic')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AND">{t('automation.logic.and')}</SelectItem>
                                <SelectItem value="OR">{t('automation.logic.or')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('automation.rules.actions')}</CardTitle>
                <CardDescription>
                  {t('automation.rules.actionsDescription')}
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-2" />
                {t('automation.rules.addAction')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {form.watch('actions').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('automation.rules.noActions')}
              </p>
            ) : (
              <div className="space-y-4">
                {form.watch('actions').map((action, index) => (
                  <Card key={index}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <FormField
                          control={form.control}
                          name={`actions.${index}.type`}
                          render={({ field }) => (
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value)
                                // Reset params when type changes
                                form.setValue(`actions.${index}.params`, { ...actionParams[value as ActionType] })
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-64">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(ActionType).map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type.split('_').join(' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Dynamic params based on action type */}
                      {action.type === ActionType.SEND_EMAIL && (
                        <div className="space-y-2">
                          <Input
                            placeholder={t('automation.email.templateName')}
                            value={form.watch(`actions.${index}.params.templateName`)}
                            onChange={e => form.setValue(`actions.${index}.params.templateName`, e.target.value)}
                          />
                          <Input
                            placeholder={t('automation.email.recipients')}
                            value={form.watch(`actions.${index}.params.to`)}
                            onChange={e => form.setValue(`actions.${index}.params.to`, e.target.value)}
                          />
                        </div>
                      )}
                      {action.type === ActionType.ASSIGN_TO_ROLE && (
                        <div className="space-y-2">
                          <Select
                            value={form.watch(`actions.${index}.params.role`)}
                            onValueChange={value => form.setValue(`actions.${index}.params.role`, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('automation.rules.selectRole')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VP">VP</SelectItem>
                              <SelectItem value="VPP">VPP</SelectItem>
                              <SelectItem value="TECH">Tech</SelectItem>
                              <SelectItem value="SALES">Sales</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={form.watch(`actions.${index}.params.balanceWorkload`)}
                              onCheckedChange={checked => form.setValue(`actions.${index}.params.balanceWorkload`, checked)}
                            />
                            <label className="text-sm">{t('automation.assignment.balanceWorkload')}</label>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? t('buttons.saving') : (rule ? t('automation.rules.updateRule') : t('automation.rules.createRule'))}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/automation')}
          >
            {t('buttons.cancel')}
          </Button>
        </div>
      </form>
    </Form>
  )
}