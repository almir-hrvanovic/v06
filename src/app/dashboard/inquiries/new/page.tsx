'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ArrowLeft, Plus, Trash2, CalendarIcon, Loader2, FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { createInquirySchema } from '@/lib/validations'
import { Priority, Currency } from '@prisma/client'
import { CurrencyInput } from '@/components/ui/currency-input'
import { AdaptiveFileUpload } from '@/components/attachments/adaptive-file-upload'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type InquiryFormData = z.infer<typeof createInquirySchema>

export default function NewInquiryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const t = useTranslations()
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileId: string; fileName: string; fileUrl: string; uploadedBy: string }>>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(createInquirySchema),
    defaultValues: {
      title: '',
      description: '',
      customerId: '',
      priority: Priority.MEDIUM,
      deadline: undefined,
      items: [{ name: '', description: '', quantity: 1, unit: 'pcs', notes: '', priceEstimation: undefined, requestedDelivery: undefined }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control: form.control,
  })

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      // API returns array directly, not wrapped in object
      setCustomers(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(t('messages.error.failedToLoad'))
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoadingCustomers(false)
    }
  }, [t])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const onSubmit = async (data: InquiryFormData) => {
    let payload: any
    try {
      setLoading(true)
      
      // Transform the data to match API expectations
      payload = {
        ...data,
        attachmentIds: uploadedFiles.map(file => file.fileId)
      }
      
      console.log('Submitting payload:', payload)
      
      const response = await apiClient.createInquiry(payload)
      
      toast.success(t('inquiries.messages.created'))
      router.push('/dashboard/inquiries')
    } catch (error) {
      console.error('Failed to create inquiry:', error)
      if (payload) {
        console.error('Payload sent:', payload)
      }
      toast.error(error instanceof Error ? error.message : t('inquiries.messages.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    append({ name: '', description: '', quantity: 1, unit: 'pcs', notes: '', priceEstimation: undefined, requestedDelivery: undefined })
  }

  const canCreateInquiry = user?.role && ['SALES', 'ADMIN', 'SUPERUSER'].includes(user.role)

  if (!canCreateInquiry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('auth.errors.unauthorized')}</h1>
            <p className="text-muted-foreground">
              {t('inquiries.messages.noPermission')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inquiries.form.create.title')}</h1>
          <p className="text-muted-foreground">
            {t('inquiries.form.create.subtitle')}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/inquiries">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('inquiries.actions.backToList')}
          </Link>
        </Button>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('inquiries.form.details.title')}</CardTitle>
              <CardDescription>
                {t('inquiries.form.details.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('inquiries.form.fields.title')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('inquiries.form.fields.titlePlaceholder')} {...field} />
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
                    <FormLabel>{t('inquiries.form.fields.description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('inquiries.form.fields.descriptionPlaceholder')}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('inquiries.form.fields.customer')} *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={loadingCustomers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingCustomers ? t('common.actions.loading') : t('inquiries.form.fields.selectCustomer')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} ({customer.email})
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
                      <FormLabel>{t('inquiries.form.fields.priority')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('inquiries.form.fields.selectPriority')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Priority.LOW}>{t('common.priority.low')}</SelectItem>
                          <SelectItem value={Priority.MEDIUM}>{t('common.priority.medium')}</SelectItem>
                          <SelectItem value={Priority.HIGH}>{t('common.priority.high')}</SelectItem>
                          <SelectItem value={Priority.URGENT}>{t('common.priority.urgent')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('inquiries.form.fields.deadline')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('inquiries.form.fields.pickDate')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      {t('inquiries.form.fields.deadlineDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('inquiries.form.documentation.title')}</CardTitle>
              <CardDescription>
                {t('inquiries.form.documentation.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium mb-2">{t('inquiries.form.documentation.uploadedFiles')}</h4>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <li key={file.fileId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{file.fileName}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedFiles(files => files.filter(f => f.fileId !== file.fileId))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      {t('inquiries.form.documentation.addDocumentation')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>{t('inquiries.form.documentation.uploadTitle')}</DialogTitle>
                      <DialogDescription>
                        {t('inquiries.form.documentation.uploadDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <AdaptiveFileUpload
                      onUploadComplete={(files) => {
                        setUploadedFiles(prev => [...prev, ...files])
                        setShowUploadDialog(false)
                        toast.success(t('inquiries.form.documentation.uploadSuccess'))
                      }}
                      onUploadError={(error) => {
                        console.error('Upload error:', error)
                        toast.error(t('inquiries.form.documentation.uploadError'))
                      }}
                      maxFiles={10}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('inquiries.form.items.title')}</CardTitle>
                  <CardDescription>
                    {t('inquiries.form.items.description')}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('inquiries.form.items.addItem')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium">{t('inquiries.form.items.itemNumber', { number: index + 1 })}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inquiries.form.fields.itemName')} *</FormLabel>
                            <FormControl>
                              <Input placeholder={t('inquiries.form.fields.itemNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inquiries.form.fields.itemDescription')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t('inquiries.form.fields.itemDescriptionPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('inquiries.form.fields.quantity')} *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('inquiries.form.fields.unit')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('inquiries.form.fields.unitPlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inquiries.form.fields.notes')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t('inquiries.form.fields.notesPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.priceEstimation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('inquiries.form.fields.priceEstimation')}</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  placeholder={t('inquiries.form.fields.priceEstimationPlaceholder')}
                                  value={field.value}
                                  onChange={(value) => field.onChange(value?.toString() || '')}
                                  showSymbol={true}
                                />
                              </FormControl>
                              <FormDescription>
                                {t('inquiries.form.fields.priceEstimationDescription')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.requestedDelivery`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>{t('inquiries.form.fields.requestedDelivery')}</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>{t('inquiries.form.fields.requestedDeliveryPlaceholder')}</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                {t('inquiries.form.fields.requestedDeliveryDescription')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/inquiries')}
              disabled={loading}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('inquiries.form.creating')}
                </>
              ) : (
                t('inquiries.form.create.button')
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}