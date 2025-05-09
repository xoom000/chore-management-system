const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Chore = sequelize.define('Chore', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recurrencePattern: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'custom'),
      allowNull: true
    },
    customRecurrenceDays: {
      type: DataTypes.STRING, // Will store JSON string of days
      allowNull: true,
      get() {
        const value = this.getDataValue('customRecurrenceDays');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('customRecurrenceDays', 
          value ? JSON.stringify(value) : null);
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'overdue'),
      defaultValue: 'pending'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    requiresVerification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true
  });

  return Chore;
};