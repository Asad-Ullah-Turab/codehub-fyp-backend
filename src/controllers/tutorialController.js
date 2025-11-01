import Tutorial from '../models/Tutorial.js';
import UserSavedTutorial from '../models/UserSavedTutorial.js';

class TutorialController {
  // Get all pre-generated tutorials, optionally filtered by language
  async getAllTutorials(req, res) {
    try {
      const { language, difficulty, concept } = req.query;
      
      // Build filter
      const filter = { isPreGenerated: true };
      
      if (language) {
        filter.language = language.toLowerCase();
      }
      
      if (difficulty) {
        filter.difficulty = difficulty.toLowerCase();
      }
      
      if (concept) {
        filter.concept = new RegExp(concept, 'i'); // Case-insensitive search
      }
      
      const tutorials = await Tutorial.find(filter)
        .select('-feedbacks') // Exclude feedbacks for list view
        .sort({ language: 1, difficulty: 1, concept: 1 })
        .lean();
      
      res.status(200).json({
        success: true,
        count: tutorials.length,
        data: tutorials
      });
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tutorials',
        error: error.message
      });
    }
  }

  // Get tutorial by ID with full details
  async getTutorialById(req, res) {
    try {
      const { id } = req.params;
      
      const tutorial = await Tutorial.findById(id)
        .populate('feedbacks', 'rating comment');
      
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          message: 'Tutorial not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: tutorial
      });
    } catch (error) {
      console.error('Error fetching tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tutorial',
        error: error.message
      });
    }
  }

  // Get tutorials by language
  async getTutorialsByLanguage(req, res) {
    try {
      const { language } = req.params;
      const { difficulty } = req.query;
      
      // Validate language
      const validLanguages = ['python', 'cpp', 'javascript'];
      if (!validLanguages.includes(language.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid language. Supported: ${validLanguages.join(', ')}`
        });
      }
      
      const filter = { 
        language: language.toLowerCase(),
        isPreGenerated: true
      };
      
      if (difficulty) {
        filter.difficulty = difficulty.toLowerCase();
      }
      
      const tutorials = await Tutorial.find(filter)
        .select('title concept difficulty language codeExamples')
        .sort({ difficulty: 1, concept: 1 })
        .lean();
      
      // Group by concept
      const grouped = tutorials.reduce((acc, tutorial) => {
        if (!acc[tutorial.concept]) {
          acc[tutorial.concept] = [];
        }
        acc[tutorial.concept].push(tutorial);
        return acc;
      }, {});
      
      res.status(200).json({
        success: true,
        language: language.toLowerCase(),
        conceptCount: Object.keys(grouped).length,
        tutorials: grouped
      });
    } catch (error) {
      console.error('Error fetching tutorials by language:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tutorials',
        error: error.message
      });
    }
  }

  // Save a tutorial for the current user
  async saveTutorial(req, res) {
    try {
      const { tutorialId } = req.body;
      const userId = req.user._id;
      
      if (!tutorialId) {
        return res.status(400).json({
          success: false,
          message: 'Tutorial ID is required'
        });
      }
      
      // Check if tutorial exists
      const tutorial = await Tutorial.findById(tutorialId);
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          message: 'Tutorial not found'
        });
      }
      
      // Check if already saved
      const alreadySaved = await UserSavedTutorial.findOne({
        userId,
        tutorialId
      });
      
      if (alreadySaved) {
        return res.status(400).json({
          success: false,
          message: 'Tutorial already saved'
        });
      }
      
      // Create new saved tutorial entry
      const savedTutorial = new UserSavedTutorial({
        userId,
        tutorialId,
        progress: {
          lastAccessedAt: new Date()
        }
      });
      
      await savedTutorial.save();
      
      res.status(201).json({
        success: true,
        message: 'Tutorial saved successfully',
        data: savedTutorial
      });
    } catch (error) {
      console.error('Error saving tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error saving tutorial',
        error: error.message
      });
    }
  }

  // Get user's saved tutorials
  async getSavedTutorials(req, res) {
    try {
      const userId = req.user._id;
      const { language } = req.query;
      
      const filter = { userId };
      
      // If language filter provided, query tutorials as well
      if (language) {
        const languageTutorials = await Tutorial.find({ language: language.toLowerCase() });
        const tutorialIds = languageTutorials.map(t => t._id);
        filter.tutorialId = { $in: tutorialIds };
      }
      
      const savedTutorials = await UserSavedTutorial.find(filter)
        .populate({
          path: 'tutorialId',
          select: 'title concept language difficulty codeExamples'
        })
        .sort({ savedAt: -1 })
        .lean();
      
      res.status(200).json({
        success: true,
        count: savedTutorials.length,
        data: savedTutorials
      });
    } catch (error) {
      console.error('Error fetching saved tutorials:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching saved tutorials',
        error: error.message
      });
    }
  }

  // Unsave a tutorial
  async unsaveTutorial(req, res) {
    try {
      const { tutorialId } = req.params;
      const userId = req.user._id;
      
      const result = await UserSavedTutorial.findOneAndDelete({
        userId,
        tutorialId
      });
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Saved tutorial not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Tutorial unsaved successfully'
      });
    } catch (error) {
      console.error('Error unsaving tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error unsaving tutorial',
        error: error.message
      });
    }
  }

  // Update tutorial progress
  async updateTutorialProgress(req, res) {
    try {
      const { tutorialId } = req.params;
      const { isCompleted, rating, notes, completedExampleId } = req.body;
      const userId = req.user._id;
      
      const savedTutorial = await UserSavedTutorial.findOne({
        userId,
        tutorialId
      });
      
      if (!savedTutorial) {
        return res.status(404).json({
          success: false,
          message: 'Saved tutorial not found'
        });
      }
      
      // Update progress
      if (isCompleted !== undefined) {
        savedTutorial.progress.isCompleted = isCompleted;
      }
      
      if (rating) {
        savedTutorial.progress.rating = rating;
      }
      
      if (notes) {
        savedTutorial.progress.notes = notes;
      }
      
      if (completedExampleId) {
        savedTutorial.progress.completedCodeExamples.push({
          exampleId: completedExampleId,
          completedAt: new Date()
        });
      }
      
      savedTutorial.progress.lastAccessedAt = new Date();
      savedTutorial.updatedAt = new Date();
      
      await savedTutorial.save();
      
      res.status(200).json({
        success: true,
        message: 'Tutorial progress updated',
        data: savedTutorial
      });
    } catch (error) {
      console.error('Error updating tutorial progress:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating tutorial progress',
        error: error.message
      });
    }
  }

  // Create a new tutorial (for AI-generated content later)
  async createTutorial(req, res) {
    try {
      const { title, description, content, language, concept, difficulty, codeExamples, tags } = req.body;
      const userId = req.user._id;
      
      // Validate required fields
      if (!title || !content || !language || !concept) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, language, and concept are required'
        });
      }
      
      const tutorial = new Tutorial({
        title,
        description,
        content,
        language: language.toLowerCase(),
        concept,
        difficulty: difficulty || 'beginner',
        codeExamples: codeExamples || [],
        tags: tags || [],
        createdBy: userId,
        isPreGenerated: false,
        isAIgenerated: false
      });
      
      await tutorial.save();
      
      res.status(201).json({
        success: true,
        message: 'Tutorial created successfully',
        data: tutorial
      });
    } catch (error) {
      console.error('Error creating tutorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating tutorial',
        error: error.message
      });
    }
  }

  // Get distinct concepts for a language
  async getConceptsByLanguage(req, res) {
    try {
      const { language } = req.params;
      
      const validLanguages = ['python', 'cpp', 'javascript'];
      if (!validLanguages.includes(language.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid language. Supported: ${validLanguages.join(', ')}`
        });
      }
      
      const concepts = await Tutorial.distinct('concept', {
        language: language.toLowerCase(),
        isPreGenerated: true
      });
      
      concepts.sort();
      
      res.status(200).json({
        success: true,
        language: language.toLowerCase(),
        count: concepts.length,
        concepts
      });
    } catch (error) {
      console.error('Error fetching concepts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching concepts',
        error: error.message
      });
    }
  }
}

export default new TutorialController();
