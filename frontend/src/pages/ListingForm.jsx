import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import { useAuth } from '../contexts/AuthContext'
import {
  apiDeleteAuth,
  apiGet,
  apiGetAuth,
  apiPostAuth,
  apiPostFormAuth,
  apiPutAuth,
} from '../lib/api'
import { getFirstImagePath, getMediaUrl } from '../components/listings/media'

const defaultForm = {
  title: '',
  description: '',
  category_id: '',
  price_amount: '',
  price_period: 'month',
  size_value: '',
  bedrooms: 1,
  halls: 1,
  kitchens: 1,
  bathrooms: 1,
  province_id: '',
  district_id: '',
  locality_id: '',
  street: '',
  amenities_text: '',
  house_rules_text: '',
  preferred_tenant_text: '',
}

export default function ListingForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [form, setForm] = useState(defaultForm)
  const [createdId, setCreatedId] = useState(null)
  const [media, setMedia] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [pendingPreviewItems, setPendingPreviewItems] = useState([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })
  const [categories, setCategories] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [localities, setLocalities] = useState([])

  const listingId = id || createdId
  const editingCoverUrl = getMediaUrl(getFirstImagePath(media)) || getMediaUrl(form.cover_image_path)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    apiGet('/api/v1/reference/public/categories').then(setCategories).catch(() => setCategories([]))
    apiGet('/api/v1/reference/public/provinces').then(setProvinces).catch(() => setProvinces([]))
  }, [])

  useEffect(() => {
    if (!id) return
    apiGetAuth(`/api/v1/listings/${id}`)
      .then((data) => setForm({ ...defaultForm, ...data }))
      .catch((error) => setStatus({ loading: false, error: error.message, success: '' }))
    apiGetAuth(`/api/v1/listings/${id}/media`)
      .then((data) => setMedia(data))
      .catch(() => setMedia([]))
  }, [id])

  useEffect(() => {
    if (!pendingFiles.length) {
      setPendingPreviewItems([])
      return undefined
    }

    const previews = pendingFiles.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    }))
    setPendingPreviewItems(previews)

    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [pendingFiles])

  useEffect(() => {
    if (!form.province_id) {
      setDistricts([])
      setLocalities([])
      return
    }
    apiGet(`/api/v1/reference/public/districts?province_id=${form.province_id}`)
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [form.province_id])

  useEffect(() => {
    if (!form.district_id) {
      setLocalities([])
      return
    }
    apiGet(`/api/v1/reference/public/localities?district_id=${form.district_id}`)
      .then(setLocalities)
      .catch(() => setLocalities([]))
  }, [form.district_id])

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '' })
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        price_amount: Number(form.price_amount),
        size_value: form.size_value ? Number(form.size_value) : null,
        bedrooms: Number(form.bedrooms),
        halls: Number(form.halls),
        kitchens: Number(form.kitchens),
        bathrooms: Number(form.bathrooms),
        province_id: Number(form.province_id),
        district_id: Number(form.district_id),
        locality_id: Number(form.locality_id),
      }

      if (id) {
        await apiPutAuth(`/api/v1/listings/${id}`, payload)
        setStatus({ loading: true, error: '', success: 'Saved.' })
        navigate('/owner/listings')
        return
      }

      const created = await apiPostAuth('/api/v1/listings', payload)
      setCreatedId(created.id)

      if (pendingFiles.length > 0) {
        const uploadFinished = await Promise.race([
          uploadMedia(created.id, pendingFiles).then(() => true),
          new Promise((resolve) => {
            setTimeout(() => resolve(false), 20000)
          }),
        ])
        if (!uploadFinished) {
          setUploadStatus('Upload is taking longer than expected. You can review it from your profile page.')
        }
        setPendingFiles([])
      }

      navigate('/profile')
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' })
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const existingCount = listingId ? media.length : pendingFiles.length
    if (existingCount + files.length > 10) {
      setUploadStatus('You can upload up to 10 files total per listing.')
      return
    }

    for (const file of files) {
      if (file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) {
        setUploadStatus('Images must be 10MB or smaller.')
        return
      }
      if (file.type.startsWith('video/') && file.size > 100 * 1024 * 1024) {
        setUploadStatus('Videos must be 100MB or smaller.')
        return
      }
    }

    if (!listingId) {
      setPendingFiles((prev) => [...prev, ...files])
      setUploadStatus('Media queued. It will upload after saving the listing.')
      return
    }

    await uploadMedia(listingId, files)
  }

  const uploadMedia = async (targetId, files) => {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }

    setUploadStatus('Uploading...')
    try {
      const updated = await apiPostFormAuth(`/api/v1/listings/${targetId}/media`, formData)
      setMedia((prev) => [...prev, ...updated])
      setUploadStatus('Upload complete.')
    } catch (error) {
      setUploadStatus(error.message)
    }
  }

  const handleDeleteMedia = async (mediaId) => {
    if (!listingId) return
    try {
      await apiDeleteAuth(`/api/v1/listings/${listingId}/media/${mediaId}`)
      setMedia((prev) => prev.filter((item) => item.id !== mediaId))
    } catch (error) {
      setUploadStatus(error.message)
    }
  }

  const removePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const reorderMedia = async (ordered) => {
    if (!listingId) return
    try {
      const data = await apiPostAuth(`/api/v1/listings/${listingId}/media/reorder`, {
        ordered_ids: ordered.map((item) => item.id),
      })
      setMedia(data)
    } catch (error) {
      setUploadStatus(error.message)
    }
  }

  const moveMedia = (index, direction) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= media.length) return
    const updated = [...media]
    const temp = updated[index]
    updated[index] = updated[nextIndex]
    updated[nextIndex] = temp
    reorderMedia(updated)
  }

  return (
    <div className="rc-page rc-listing-editor">
      <div className="rc-page__header rc-listing-editor__header">
        <div>
          <h2>{id ? 'Edit listing' : 'Create listing'}</h2>
          <p>Present your room clearly with complete details and media.</p>
        </div>
        <div className="rc-listing-editor__status">
          <span className="rc-listing-editor__pill">{listingId ? 'Editing mode' : 'Draft mode'}</span>
          <span className="rc-listing-editor__pill">{listingId ? `${media.length} uploaded` : `${pendingFiles.length} queued`}</span>
        </div>
      </div>

      <div className="rc-listing-editor__layout">
        <Card className="rc-card rc-listing-editor__main">
          <form className="rc-form" onSubmit={handleSubmit}>
            <div className="rc-form__section">
              <h3>Basics</h3>
              <div className="rc-form__section-grid">
                <Input label="Title" name="title" value={form.title} onChange={handleChange} required />
                <Select label="Category" name="category_id" value={form.category_id} onChange={handleChange}>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <Textarea
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  wrapperClassName="rc-form__span-2"
                />
              </div>
            </div>
            <div className="rc-form__section">
              <h3>Pricing & specs</h3>
              <div className="rc-form__section-grid">
                <Input label="Price" name="price_amount" type="number" value={form.price_amount} onChange={handleChange} required />
                <Select label="Price period" name="price_period" value={form.price_period} onChange={handleChange}>
                  <option value="month">Monthly</option>
                  <option value="week">Weekly</option>
                  <option value="day">Daily</option>
                </Select>
                <Input label="Size (sq ft)" name="size_value" type="number" value={form.size_value} onChange={handleChange} />
                <Input label="Bedrooms" name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange} />
                <Input label="Halls" name="halls" type="number" value={form.halls} onChange={handleChange} />
                <Input label="Kitchens" name="kitchens" type="number" value={form.kitchens} onChange={handleChange} />
                <Input label="Bathrooms" name="bathrooms" type="number" value={form.bathrooms} onChange={handleChange} />
              </div>
            </div>
            <div className="rc-form__section">
              <h3>Location</h3>
              <div className="rc-form__section-grid">
                <Select label="Province" name="province_id" value={form.province_id} onChange={handleChange} required>
                  <option value="">Select province</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </Select>
                <Select label="District" name="district_id" value={form.district_id} onChange={handleChange} required>
                  <option value="">Select district</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </Select>
                <Select label="Locality" name="locality_id" value={form.locality_id} onChange={handleChange} required>
                  <option value="">Select locality</option>
                  {localities.map((locality) => (
                    <option key={locality.id} value={locality.id}>
                      {locality.name}
                    </option>
                  ))}
                </Select>
                <Input label="Street" name="street" value={form.street} onChange={handleChange} />
              </div>
            </div>
            <div className="rc-form__section">
              <h3>House details</h3>
              <div className="rc-form__section-grid">
                <Textarea
                  label="Amenities"
                  name="amenities_text"
                  value={form.amenities_text}
                  onChange={handleChange}
                  rows={3}
                />
                <Textarea
                  label="House rules"
                  name="house_rules_text"
                  value={form.house_rules_text}
                  onChange={handleChange}
                  rows={3}
                />
                <Textarea
                  label="Preferred tenant"
                  name="preferred_tenant_text"
                  value={form.preferred_tenant_text}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>
            <div className="rc-form__footer">
              {status.error ? <p className="rc-error">{status.error}</p> : null}
              {status.success ? <p className="rc-success">{status.success}</p> : null}
              <Button type="submit" disabled={status.loading}>
                {status.loading ? 'Saving...' : 'Save listing'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="rc-listing-editor__side">
          <Card className="rc-card">
            <h3>Media</h3>
            <p className="rc-muted">
              Upload up to 10 images/videos per listing. {listingId ? '' : 'Files will upload after saving.'}
            </p>

            {listingId && editingCoverUrl ? (
              <div className="rc-media-preview">
                <img src={editingCoverUrl} alt="Listing cover preview" />
                <p className="rc-muted">Current first image</p>
              </div>
            ) : null}

            <Input
              label={listingId ? 'Add media' : 'Queue media'}
              name="media"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleUpload}
            />
            {uploadStatus ? <p className="rc-muted">{uploadStatus}</p> : null}

            {!listingId && pendingPreviewItems.length > 0 ? (
              <div className="rc-media-preview-grid">
                {pendingPreviewItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="rc-media-preview-tile">
                    {item.type.startsWith('image/') ? (
                      <img src={item.url} alt={item.name} />
                    ) : (
                      <video src={item.url} muted controls />
                    )}
                    <div className="rc-media-preview-tile__meta">
                      <p>{item.name}</p>
                      <span>{formatBytes(item.size)}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removePendingFile(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            {listingId ? (
              <div className="rc-media-preview-grid">
                {media.map((item, index) => (
                  <div key={item.id} className="rc-media-preview-tile">
                    {item.media_type === 'image' ? (
                      <img src={getMediaUrl(item.file_path)} alt={`media-${item.id}`} />
                    ) : (
                      <video src={getMediaUrl(item.file_path)} controls />
                    )}
                    <div className="rc-media-preview-tile__meta">
                      <p>{item.media_type.toUpperCase()}</p>
                      <span>Position {index + 1}</span>
                    </div>
                    <div className="rc-media-admin__actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => moveMedia(index, -1)}
                        disabled={index === 0}
                      >
                        Up
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => moveMedia(index, 1)}
                        disabled={index === media.length - 1}
                      >
                        Down
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteMedia(item.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="rc-card rc-listing-editor__tips">
            <h3>Quality checklist</h3>
            <ul>
              <li>Lead with a bright, wide image of the room.</li>
              <li>Describe nearby landmarks in the description.</li>
              <li>Keep house rules short and specific.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
