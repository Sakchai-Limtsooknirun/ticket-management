import { FC, useState, FormEvent } from 'react';
import { ChemicalConfig, Ticket, User } from '../../types/system';
import '../../styles/tickets/TicketCreation.css';

interface TicketCreationProps {
  currentUser: User;
  onSubmit: (ticket: Omit<Ticket, '_id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const TicketCreation: FC<TicketCreationProps> = ({ currentUser, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chemicalConfig, setChemicalConfig] = useState<ChemicalConfig>({
    machineId: '',
    machineName: '',
    chemicalType: '',
    concentration: 0,
    temperature: 0,
    flowRate: 0,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('requesterId', currentUser._id);
      formData.append('department', currentUser.department);
      formData.append('chemicalConfig', JSON.stringify(chemicalConfig));
      
      // Append each file to the FormData
      files.forEach(file => {
        formData.append('files', file);
      });

      await onSubmit({
        title,
        description,
        requesterId: currentUser._id,
        requester: currentUser,
        department: currentUser.department,
        chemicalConfig,
        attachments: [], // Backend will handle file processing
        requestDate: new Date().toISOString(),
      });

      // Reset form
      setTitle('');
      setDescription('');
      setChemicalConfig({
        machineId: '',
        machineName: '',
        chemicalType: '',
        concentration: 0,
        temperature: 0,
        flowRate: 0,
      });
      setFiles([]);
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ticket-creation">
      <h2>Create New Chemical Configuration Request</h2>
      <form onSubmit={handleSubmit} className="ticket-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter request title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe your request"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Machine Chemical Configuration</h3>
          <div className="form-group">
            <label htmlFor="machineId">Machine ID</label>
            <input
              type="text"
              id="machineId"
              value={chemicalConfig.machineId}
              onChange={(e) =>
                setChemicalConfig({ ...chemicalConfig, machineId: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="machineName">Machine Name</label>
            <input
              type="text"
              id="machineName"
              value={chemicalConfig.machineName}
              onChange={(e) =>
                setChemicalConfig({ ...chemicalConfig, machineName: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="chemicalType">Chemical Type</label>
            <input
              type="text"
              id="chemicalType"
              value={chemicalConfig.chemicalType}
              onChange={(e) =>
                setChemicalConfig({ ...chemicalConfig, chemicalType: e.target.value })
              }
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="concentration">Concentration (%)</label>
              <input
                type="number"
                id="concentration"
                value={chemicalConfig.concentration}
                onChange={(e) =>
                  setChemicalConfig({
                    ...chemicalConfig,
                    concentration: parseFloat(e.target.value),
                  })
                }
                required
                min="0"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="temperature">Temperature (°C)</label>
              <input
                type="number"
                id="temperature"
                value={chemicalConfig.temperature}
                onChange={(e) =>
                  setChemicalConfig({
                    ...chemicalConfig,
                    temperature: parseFloat(e.target.value),
                  })
                }
                required
                min="0"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="flowRate">Flow Rate (L/min)</label>
              <input
                type="number"
                id="flowRate"
                value={chemicalConfig.flowRate}
                onChange={(e) =>
                  setChemicalConfig({
                    ...chemicalConfig,
                    flowRate: parseFloat(e.target.value),
                  })
                }
                required
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Attachments</h3>
          <div className="form-group">
            <label htmlFor="attachments">Upload Files</label>
            <input
              type="file"
              id="attachments"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </div>
          {files.length > 0 && (
            <div className="file-list">
              <h4>Selected Files:</h4>
              <ul>
                {files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketCreation; 