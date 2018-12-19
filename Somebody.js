import React from 'react'
import PropTypes from 'prop-types'

class Somebody extends React.PureComponent {
  render() {
    const { name, santa } = this.props
    return (
      <div className='wrapper'>
        <div className='name'>
          {name}
        </div>
        <div className='secret-santa'>
          {santa}
        </div>
      </div>
    )
  }
}

Somebody.propTypes = {
  name: PropTypes.string.isRequired,
  santa: PropTypes.string.isRequired,
}

export default Somebody
