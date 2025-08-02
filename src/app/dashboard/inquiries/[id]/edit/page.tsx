'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { ArrowLeft, Plus, Trash2, CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { updateInquirySchema } from '@/lib/validations'
import { Priority, InquiryStatus } from '@prisma/client'
import { CurrencyInput } from '@/components/ui/currency-input'
import { AttachmentManager } from '@/components/attachments/attachment-manager'
import { BulkDocumentUploadV2 } from '@/components/attachments/bulk-document-upload-v2'
import { BrowseFolderButton } from '@/components/attachments/browse-folder-button'

type InquiryFormData = z.infer<typeof updateInquirySchema>

export default function EditInquiryPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [loadingInquiry, setLoadingInquiry] = useState(true)
  const [inquiry, setInquiry] = useState<any>(null)

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(updateInquirySchema),
    defaultValues: {
      title: '',
      description: '',
      priority: Priority.MEDIUM,
      deadline: undefined,
      status: InquiryStatus.DRAFT,
    }
  })

  const fetchInquiry = useCallback(async () => {
    try {
      const response = await apiClient.getInquiry(params.id as string) as any
      setInquiry(response.data)
      
      // Set form values
      form.reset({
        title: response.data.title,
        description: response.data.description || '',
        priority: response.data.priority,
        deadline: response.data.deadline ? new Date(response.data.deadline) : undefined,
        status: response.data.status,
      })
    } catch (error) {
      toast.error(t('messages.error.failedToLoad'))
      console.error('Failed to fetch inquiry:', error)
      router.push('/dashboard/inquiries')
    } finally {
      setLoadingInquiry(false)
    }
  }, [params.id, router, t, form])

  useEffect(() => {
    fetchInquiry()
  }, [fetchInquiry])

  const onSubmit = async (data: InquiryFormData) => {
    try {
      setLoading(true)
      
      await apiClient.updateInquiry(params.id as string, data)
      
      toast.success(t('inquiries.messages.updated'))
      router.push(`/dashboard/inquiries/${params.id}`)
    } catch (error) {
      console.error('Failed to update inquiry:', error)
      toast.error(error instanceof Error ? error.message : t('inquiries.messages.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const canEditInquiry = user?.role && ['SALES', 'ADMIN', 'SUPERUSER'].includes(user.role)

  if (!canEditInquiry) {
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

  if (loadingInquiry) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inquiries.form.edit.title')}</h1>
          <p className="text-muted-foreground">
            {t('inquiries.form.edit.subtitle')}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/inquiries/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('inquiries.actions.backToDetails')}
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('inquiries.form.fields.status')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('inquiries.form.fields.selectStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={InquiryStatus.DRAFT}>{t('common.status.draft')}</SelectItem>
                          <SelectItem value={InquiryStatus.SUBMITTED}>{t('common.status.submitted')}</SelectItem>
                          <SelectItem value={InquiryStatus.IN_REVIEW}>{t('common.status.inReview')}</SelectItem>
                          <SelectItem value={InquiryStatus.ASSIGNED}>{t('common.status.assigned')}</SelectItem>
                          <SelectItem value={InquiryStatus.COSTING}>{t('common.status.costing')}</SelectItem>
                          <SelectItem value={InquiryStatus.QUOTED}>{t('common.status.quoted')}</SelectItem>
                          <SelectItem value={InquiryStatus.APPROVED}>{t('common.status.approved')}</SelectItem>
                          <SelectItem value={InquiryStatus.REJECTED}>{t('common.status.rejected')}</SelectItem>
                          <SelectItem value={InquiryStatus.CONVERTED}>{t('common.status.converted')}</SelectItem>
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

          {/* Attachments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t('inquiries.form.documentation.title')}</h3>
              <BrowseFolderButton
                inquiryId={params.id as string}
                size="sm"
              />
            </div>
            <AttachmentManager
              inquiryId={params.id as string}
              showUpload={true}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/inquiries/${params.id}`)}
              disabled={loading}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('inquiries.form.updating')}
                </>
              ) : (
                t('inquiries.form.update.button')
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}