import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { hasPermission } from '@/utils/supabase/api-auth'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

const updateBusinessPartnerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'business_partners', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const businessPartner = await db.businessPartner.findUnique({
      where: { id }
    })

    if (!businessPartner) {
      return NextResponse.json(
        { error: 'Business partner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(businessPartner)

  } catch (error) {
    console.error('Error fetching business partner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'business_partners', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateBusinessPartnerSchema.parse(body)

    const { id } = await params

    // Check if business partner exists
    const existingPartner = await db.businessPartner.findUnique({
      where: { id }
    })

    if (!existingPartner) {
      return NextResponse.json(
        { error: 'Business partner not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name if name is being updated
    if (data.name && data.name !== existingPartner.name) {
      const duplicatePartner = await db.businessPartner.findUnique({
        where: { name: data.name }
      })

      if (duplicatePartner) {
        return NextResponse.json(
          { error: 'Business partner with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedPartner = await db.businessPartner.update({
      where: { id },
      data
    })

    return NextResponse.json(updatedPartner)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating business partner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'business_partners', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if business partner exists
    const existingPartner = await db.businessPartner.findUnique({
      where: { id }
    })

    if (!existingPartner) {
      return NextResponse.json(
        { error: 'Business partner not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    const deletedPartner = await db.businessPartner.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json(deletedPartner)

  } catch (error) {
    console.error('Error deleting business partner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}